// backend/src/modules/merkle/merkle.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { MerkleTree } from "merkletreejs";
import { ethers } from "ethers";
import * as crypto from "crypto";

@Injectable()
export class MerkleService {
  private readonly logger = new Logger(MerkleService.name);
  private trees: Map<number, MerkleTree> = new Map();

  async buildTree(leaves: string[]): Promise<string> {
    try {
      const hashedLeaves = leaves.map((leaf) =>
        ethers.keccak256(ethers.toUtf8Bytes(leaf)),
      );

      const tree = new MerkleTree(hashedLeaves, ethers.keccak256, {
        sort: true,
        sortLeaves: true,
        sortPairs: true,
      });

      const root = tree.getRoot();
      const rootHex = `0x${root.toString("hex")}`;

      this.logger.log(`🌳 Merkle Tree construido. Raíz: ${rootHex}`);
      this.logger.log(`   Hojas: ${leaves.length}`);

      return rootHex;
    } catch (error) {
      this.logger.error(`❌ Error construyendo Merkle Tree: ${error.message}`);
      throw error;
    }
  }

  async verifyProof(
    leaf: string,
    proof: string[],
    root: string,
  ): Promise<boolean> {
    try {
      const hashedLeaf = ethers.keccak256(ethers.toUtf8Bytes(leaf));

      // Verificar que proof sea un array
      if (!Array.isArray(proof)) {
        this.logger.error("Proof no es un array");
        return false;
      }

      // Verificar cada elemento del proof
      const proofBuffer = proof.map((p) => Buffer.from(p.slice(2), "hex"));

      const tree = new MerkleTree([], ethers.keccak256);
      const isValid = tree.verify(
        proofBuffer,
        hashedLeaf,
        Buffer.from(root.slice(2), "hex"),
      );

      this.logger.log(`🔍 Verificación Merkle: ${isValid}`);
      return isValid;
    } catch (error) {
      this.logger.error(`❌ Error verificando Merkle Proof: ${error.message}`);
      return false;
    }
  }

  async getProof(tree: MerkleTree, leaf: string): Promise<string[]> {
    try {
      const hashedLeaf = ethers.keccak256(ethers.toUtf8Bytes(leaf));
      const proof = tree.getProof(hashedLeaf);

      return proof.map((p) => `0x${p.data.toString("hex")}`);
    } catch (error) {
      this.logger.error(`❌ Error obteniendo Merkle Proof: ${error.message}`);
      throw error;
    }
  }

  async generateMerkleRoot(votes: any[]): Promise<string> {
    const leaves = votes.map((v) => v.voteHash);
    return this.buildTree(leaves);
  }

  async addVoteToTree(sessionId: number, voteHash: string): Promise<any> {
    let tree = this.trees.get(sessionId);

    if (!tree) {
      tree = new MerkleTree([], ethers.keccak256, {
        sort: true,
        sortLeaves: true,
        sortPairs: true,
      });
      this.trees.set(sessionId, tree);
    }

    const hashedLeaf = Buffer.from(
      ethers.keccak256(ethers.toUtf8Bytes(voteHash)).slice(2),
      "hex",
    );
    tree.addLeaf(hashedLeaf);
    tree = new MerkleTree(tree.getLeaves(), ethers.keccak256, {
      sort: true,
      sortLeaves: true,
      sortPairs: true,
    });

    this.trees.set(sessionId, tree);

    const proof = await this.getProof(tree, voteHash);
    const root = tree.getRoot();

    return {
      proof,
      root: `0x${root.toString("hex")}`,
      leaves: tree.getLeaves().length,
    };
  }

  async getTreeInfo(sessionId: number): Promise<any> {
    const tree = this.trees.get(sessionId);

    if (!tree) {
      return {
        exists: false,
        leaves: 0,
        root: null,
      };
    }

    const root = tree.getRoot();

    return {
      exists: true,
      leaves: tree.getLeaves().length,
      root: `0x${root.toString("hex")}`,
      depth: tree.getDepth(),
    };
  }

  async combineTrees(
    sessionId: number,
    realVotes: any[],
    noiseVotes: any[],
  ): Promise<any> {
    // Combinar votos reales y de ruido en un solo Merkle Tree
    const allVotes = [...realVotes, ...noiseVotes];
    // Mezclar aleatoriamente
    const shuffled = this.shuffleArray(allVotes);

    const leaves = shuffled.map((v) => v.voteHash);
    const root = await this.buildTree(leaves);

    return {
      root,
      totalVotes: allVotes.length,
      realVotes: realVotes.length,
      noiseVotes: noiseVotes.length,
      shuffled,
    };
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}
