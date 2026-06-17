// backend/src/modules/zkp/zkp.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as snarkjs from "snarkjs";
import { ethers } from "ethers";

@Injectable()
export class ZKPService {
  private readonly logger = new Logger(ZKPService.name);
  private readonly wasmPath: string;
  private readonly zkeyPath: string;

  constructor(private configService: ConfigService) {
    this.wasmPath =
      this.configService.get("ZKP_WASM_PATH") || "circuits/vote.wasm";
    this.zkeyPath =
      this.configService.get("ZKP_ZKEY_PATH") || "circuits/vote.zkey";
  }

  async generateProof(input: any): Promise<any> {
    try {
      this.logger.log("Generando prueba ZKP...");

      const fs = require("fs");
      if (!fs.existsSync(this.wasmPath) || !fs.existsSync(this.zkeyPath)) {
        this.logger.warn(
          "⚠️ Archivo de circuito (.wasm/.zkey) no encontrado. Usando prueba Mock (Desarrollo).",
        );
        return this.generateMockProof(input);
      }

      // Preparar inputs para el circuito
      const circuitInputs = {
        voterId: this.hashToField(input.voterId),
        candidateId: this.hashToField(input.candidateId),
        sessionId: this.hashToField(String(input.sessionId)),
        timestamp: this.hashToField(String(input.timestamp)),
        random: this.hashToField(this.generateRandom()),
      };

      // Generar prueba
      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInputs,
        this.wasmPath,
        this.zkeyPath,
      );

      this.logger.log("✅ ZKP generada exitosamente");

      return {
        proof,
        publicSignals,
      };
    } catch (error) {
      this.logger.error(`❌ Error generando ZKP: ${error.message}`);
      throw error;
    }
  }

  async verifyProof(proof: any): Promise<boolean> {
    try {
      this.logger.log("Verificando prueba ZKP...");

      const fs = require("fs");
      const vkeyPath =
        this.configService.get("ZKP_VKEY_PATH") || "circuits/vote.vkey.json";

      if (!fs.existsSync(vkeyPath)) {
        this.logger.warn(
          `⚠️ Archivo de verificación ZKP no encontrado en ${vkeyPath}. Usando verificación Mock (Desarrollo).`,
        );
        return true;
      }

      // Verificar prueba
      const isValid = await snarkjs.groth16.verify(
        await this.getVerificationKey(),
        proof.publicSignals,
        proof.proof,
      );

      this.logger.log(`✅ ZKP verificación: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error(`❌ Error verificando ZKP: ${error.message}`);
      return false;
    }
  }

  async generateMockProof(input: any): Promise<any> {
    // Mock para desarrollo
    return {
      proof: {
        a: ["0", "0"],
        b: [
          ["0", "0"],
          ["0", "0"],
        ],
        c: ["0", "0"],
      },
      publicSignals: ["0", "0", "0", "0"],
    };
  }

  private async getVerificationKey(): Promise<any> {
    // Obtener clave de verificación
    const vkeyPath =
      this.configService.get("ZKP_VKEY_PATH") || "circuits/vote.vkey.json";
    const fs = require("fs");
    return JSON.parse(fs.readFileSync(vkeyPath, "utf8"));
  }

  private hashToField(value: string): string {
    // Convertir string a field element
    const hash = ethers.keccak256(ethers.toUtf8Bytes(value));
    return BigInt(hash).toString(10);
  }

  private generateRandom(): string {
    return Math.random().toString(36).substring(7);
  }
}
