// backend/src/modules/voting/voting.consumer.ts
import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
} from "@nestjs/bull";
import { Job } from "bull";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ethers } from "ethers";

import { Vote } from "./entities/vote.entity";
import { Session } from "./entities/session.entity";
import { BlockchainService } from "../blockchain/blockchain.service";
import { MerkleService } from "../merkle/merkle.service";

@Processor("voting")
@Injectable()
export class VotingConsumer {
  private readonly logger = new Logger(VotingConsumer.name);

  constructor(
    @InjectRepository(Vote)
    private voteRepo: Repository<Vote>,
    @InjectRepository(Session)
    private sessionRepo: Repository<Session>,
    private blockchainService: BlockchainService,
    private merkleService: MerkleService,
  ) {}

  @Process("cast-vote")
  async processVote(job: Job) {
    this.logger.log(`Procesando voto: ${job.id}`);

    const { voteInput, user } = job.data;

    try {
      // 1. Validar votante
      const hasVoted = await this.voteRepo.findOne({
        where: {
          sessionId: voteInput.sessionId,
          nullifierHash: voteInput.nullifierHash,
        },
      });

      if (hasVoted) {
        throw new Error("Usuario ya votó en esta sesión");
      }

      // 2. Generar ZKP
      const zkp = await this.generateZKP(voteInput);

      // 3. Guardar voto
      const vote = this.voteRepo.create({
        ...voteInput,
        zkpProof: zkp,
        status: "processing",
      }) as unknown as Vote;

      const savedVote = await this.voteRepo.save(vote);

      // 4. Enviar a blockchain
      const txResult = await this.blockchainService.castVote(
        voteInput.sessionId,
        voteInput.voteHash,
        voteInput.merkleProof || [],
        zkp,
        voteInput.nullifierHash,
        voteInput.candidateId,
      );

      // 5. Actualizar voto
      savedVote.txHash = txResult.txHash;
      savedVote.blockNumber = txResult.blockNumber;
      savedVote.gasCost = txResult.cost;
      savedVote.status = "confirmed";
      await this.voteRepo.save(savedVote);

      // 6. Actualizar Merkle Tree
      await this.updateMerkleTree(voteInput.sessionId);

      // 7. Generar ruido
      await this.generateNoise(voteInput.sessionId);

      this.logger.log(`✅ Voto procesado: ${savedVote.voteHash}`);

      return {
        success: true,
        voteHash: savedVote.voteHash,
        txHash: txResult.txHash,
        blockNumber: txResult.blockNumber,
        gasCost: txResult.cost,
      };
    } catch (error) {
      this.logger.error(`❌ Error procesando voto: ${error.message}`);
      throw error;
    }
  }

  @Process("generate-noise")
  async generateNoise(job: Job) {
    const { sessionId, count } = job.data;
    this.logger.log(
      `Generando ${count} votos de ruido para sesión ${sessionId}`,
    );

    try {
      // Implementación de generación de ruido
      // ...
      this.logger.log(`✅ Ruido generado para sesión ${sessionId}`);
    } catch (error) {
      this.logger.error(`❌ Error generando ruido: ${error.message}`);
      throw error;
    }
  }

  @Process("update-merkle-tree")
  async updateMerkleTree(job: Job) {
    const { sessionId } = job.data;
    this.logger.log(`Actualizando Merkle Tree para sesión ${sessionId}`);

    try {
      const votes = await this.voteRepo.find({
        where: { sessionId, status: "confirmed" },
      });

      const voteHashes = votes.map((v) => v.voteHash);
      const merkleRoot = await this.merkleService.buildTree(voteHashes);

      // Actualizar en blockchain
      await this.blockchainService.updateMerkleRoot(sessionId, merkleRoot);

      // Actualizar en base de datos
      await this.sessionRepo.update(sessionId, { merkleRoot });

      this.logger.log(`✅ Merkle Tree actualizado: ${merkleRoot}`);
    } catch (error) {
      this.logger.error(`❌ Error actualizando Merkle Tree: ${error.message}`);
      throw error;
    }
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(`Procesando job ${job.id} de tipo ${job.name}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completado: ${JSON.stringify(result)}`);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} falló: ${error.message}`);
  }

  private async generateZKP(voteInput: any): Promise<any> {
    // Implementación de generación de ZKP
    return {
      proof: {
        a: ["0", "0"],
        b: [
          ["0", "0"],
          ["0", "0"],
        ],
        c: ["0", "0"],
      },
      publicSignals: ["0"],
    };
  }
}
