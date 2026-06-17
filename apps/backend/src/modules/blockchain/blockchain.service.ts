// backend/src/modules/blockchain/blockchain.service.ts
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ethers, Contract, Wallet, JsonRpcProvider } from "ethers";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class BlockchainService implements OnModuleInit {
  private readonly logger = new Logger(BlockchainService.name);
  private provider: JsonRpcProvider;
  private wallet: Wallet;
  private contract: Contract;
  private contractAddress: string;
  private gasPrice: bigint;
  private contractABI: any;

  constructor(
    private configService: ConfigService,
    @InjectQueue("blockchain") private blockchainQueue: Queue,
  ) {
    this.contractAddress = this.configService.get("CONTRACT_ADDRESS");
    this.gasPrice = ethers.parseUnits(
      this.configService.get("SYSCOIN_GAS_PRICE", "20"),
      "gwei",
    );
  }

  async onModuleInit() {
    await this.initializeConnection();
    await this.setupContractListeners();
  }

  private async initializeConnection() {
    try {
      const rpcUrl = this.configService.get("SYSCOIN_RPC_URL");
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      const privateKey = this.configService.get("PRIVATE_KEY");
      this.wallet = new Wallet(privateKey, this.provider);

      // Cargar ABI del contrato
      const abiPath = path.join(
        __dirname,
        "../../../contracts/artifacts/contracts/Election.sol/Election.json",
      );
      const contractJson = JSON.parse(fs.readFileSync(abiPath, "utf8"));
      this.contractABI = contractJson.abi;

      this.contract = new Contract(
        this.contractAddress,
        this.contractABI,
        this.wallet,
      );

      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);

      this.logger.log(`✅ Conectado a Syscoin NEVM`);
      this.logger.log(`📡 Red: ${network.name} (${network.chainId})`);
      this.logger.log(`💰 Balance: ${ethers.formatEther(balance)} SYS`);
      this.logger.log(`📋 Contrato: ${this.contractAddress}`);

      // Verificar balance mínimo
      const minBalance = ethers.parseEther("1");
      if (balance < minBalance) {
        this.logger.warn(`⚠️ Balance bajo: ${ethers.formatEther(balance)} SYS`);
        this.logger.warn(
          `   Se recomienda tener al menos 1 SYS para transacciones`,
        );
      }
    } catch (error) {
      this.logger.error(`❌ Error conectando a Syscoin: ${error.message}`);
      throw error;
    }
  }

  private async setupContractListeners() {
    this.contract.on(
      "VoteCast",
      async (sessionId, voter, voteHash, merkleRoot, event) => {
        this.logger.log(`🎯 Evento VoteCast recibido`);
        this.logger.log(`   Sesión: ${sessionId}`);
        this.logger.log(`   Votante: ${voter}`);
        this.logger.log(`   Hash: ${voteHash}`);

        await this.blockchainQueue.add("process-vote-event", {
          sessionId: sessionId.toString(),
          voter,
          voteHash,
          merkleRoot,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        });
      },
    );

    this.contract.on(
      "SessionCreated",
      async (sessionId, name, startTime, endTime, event) => {
        this.logger.log(`📝 Nueva sesión creada: ${sessionId}`);
        this.logger.log(`   Nombre: ${name}`);

        await this.blockchainQueue.add("process-session-event", {
          sessionId: sessionId.toString(),
          name,
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          transactionHash: event.transactionHash,
        });
      },
    );

    this.contract.on(
      "SessionFinalized",
      async (sessionId, totalVotes, validVotes, event) => {
        this.logger.log(`🏁 Sesión finalizada: ${sessionId}`);
        this.logger.log(`   Total votos: ${totalVotes}`);
        this.logger.log(`   Votos válidos: ${validVotes}`);
      },
    );

    this.logger.log("👂 Listeners del contrato configurados");
  }

  async castVote(
    sessionId: number,
    voteHash: string,
    merkleProof: string[],
    zkp: any,
    signature: string,
  ): Promise<any> {
    try {
      this.logger.log(`🎯 Emitiendo voto para sesión ${sessionId}`);

      // Validar input
      if (!sessionId || !voteHash || !zkp || !signature) {
        throw new Error("Faltan parámetros para el voto");
      }

      // Preparar datos para el contrato
      const proof = {
        a: zkp.proof.a.map((p: string) => BigInt(p)),
        b: zkp.proof.b.map((row: string[]) =>
          row.map((p: string) => BigInt(p)),
        ),
        c: zkp.proof.c.map((p: string) => BigInt(p)),
        input: zkp.publicSignals.map((s: string) => BigInt(s)),
      };

      // Estimar gas
      const gasEstimate = await this.contract.castVote.estimateGas(
        sessionId,
        voteHash,
        merkleProof,
        proof,
        signature,
      );

      // Calcular gas limit con buffer
      const gasLimit = (gasEstimate * 130n) / 100n; // 30% buffer

      const maxGasLimit = 5000000n;
      if (gasLimit > maxGasLimit) {
        this.logger.warn(
          `⚠️ Gas limit alto: ${gasLimit}. Limitando a ${maxGasLimit}`,
        );
      }

      const finalGasLimit = gasLimit > maxGasLimit ? maxGasLimit : gasLimit;

      // Calcular costo estimado
      const estimatedCost = finalGasLimit * this.gasPrice;
      this.logger.log(`⛽ Gas estimado: ${finalGasLimit}`);
      this.logger.log(
        `⛽ Precio gas: ${ethers.formatUnits(this.gasPrice, "gwei")} Gwei`,
      );
      this.logger.log(
        `⛽ Costo estimado: ${ethers.formatEther(estimatedCost)} SYS`,
      );

      // Verificar balance
      const balance = await this.provider.getBalance(this.wallet.address);
      if (balance < estimatedCost) {
        throw new Error(
          `Balance insuficiente. Necesita ${ethers.formatEther(estimatedCost)} SYS`,
        );
      }

      // Enviar transacción
      const tx = await this.contract.castVote(
        sessionId,
        voteHash,
        merkleProof,
        proof,
        signature,
        {
          gasLimit: finalGasLimit,
          gasPrice: this.gasPrice,
          nonce: await this.provider.getTransactionCount(this.wallet.address),
        },
      );

      this.logger.log(`⛓️ Transacción enviada: ${tx.hash}`);

      // Esperar confirmación
      const receipt = await tx.wait();

      // Calcular costo final
      const gasUsed = receipt.gasUsed;
      const cost = gasUsed * this.gasPrice;

      this.logger.log(`✅ Transacción confirmada: ${receipt.hash}`);
      this.logger.log(`⛽ Gas usado: ${gasUsed}`);
      this.logger.log(`⛽ Costo final: ${ethers.formatEther(cost)} SYS`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        cost: ethers.formatEther(cost),
        status: receipt.status === 1 ? "success" : "failed",
      };
    } catch (error) {
      this.logger.error(`❌ Error emitiendo voto: ${error.message}`);

      if (error.code === "INSUFFICIENT_FUNDS") {
        throw new Error("Balance insuficiente en SYS para la transacción");
      }

      throw error;
    }
  }

  async verifyVote(
    sessionId: number,
    voteHash: string,
    merkleProof: string[],
  ): Promise<boolean> {
    try {
      const isValid = await this.contract.verifyVote(
        sessionId,
        voteHash,
        merkleProof,
      );
      this.logger.log(`🔍 Verificación de voto: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error(`❌ Error verificando voto: ${error.message}`);
      return false;
    }
  }

  async updateMerkleRoot(sessionId: number, merkleRoot: string): Promise<any> {
    try {
      this.logger.log(`🌳 Actualizando Merkle Root para sesión ${sessionId}`);

      const tx = await this.contract.updateMerkleRoot(sessionId, merkleRoot, {
        gasPrice: this.gasPrice,
      });

      const receipt = await tx.wait();

      this.logger.log(`✅ Merkle Root actualizado: ${receipt.hash}`);

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        merkleRoot,
      };
    } catch (error) {
      this.logger.error(`❌ Error actualizando Merkle Root: ${error.message}`);
      throw error;
    }
  }

  async getTransactionConfirmations(txHash: string): Promise<number> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) return 0;

      const currentBlock = await this.provider.getBlockNumber();
      return currentBlock - receipt.blockNumber + 1;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo confirmaciones: ${error.message}`);
      return 0;
    }
  }

  async getGasPrice(): Promise<string> {
    const feeData = await this.provider.getFeeData();
    const price = feeData.gasPrice || 0n;
    return ethers.formatUnits(price, "gwei");
  }

  async getSyscoinBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getNetworkInfo(): Promise<any> {
    const network = await this.provider.getNetwork();
    const blockNumber = await this.provider.getBlockNumber();
    const gasPrice = await this.getGasPrice();

    return {
      name: network.name,
      chainId: network.chainId.toString(),
      blockNumber,
      gasPrice,
      contractAddress: this.contractAddress,
    };
  }

  async estimateVoteGas(
    sessionId: number,
    voteHash: string,
    merkleProof: string[],
    zkp: any,
    signature: string,
  ): Promise<any> {
    try {
      const proof = {
        a: zkp.proof.a.map((p: string) => BigInt(p)),
        b: zkp.proof.b.map((row: string[]) =>
          row.map((p: string) => BigInt(p)),
        ),
        c: zkp.proof.c.map((p: string) => BigInt(p)),
        input: zkp.publicSignals.map((s: string) => BigInt(s)),
      };

      const gasEstimate = await this.contract.castVote.estimateGas(
        sessionId,
        voteHash,
        merkleProof,
        proof,
        signature,
      );

      const gasPrice = await this.getGasPrice();
      const cost = gasEstimate * ethers.parseUnits(gasPrice, "gwei");

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice,
        cost: ethers.formatEther(cost),
        recommendation:
          gasEstimate > 1000000
            ? "Considere usar una red menos congestionada"
            : "OK",
      };
    } catch (error) {
      this.logger.error(`❌ Error estimando gas: ${error.message}`);
      throw error;
    }
  }
}
