// frontend/src/utils/merkleTree.ts
import { ethers } from 'ethers';

export class MerkleTree {
  private leaves: string[];
  private tree: string[][];

  constructor(leaves: string[]) {
    this.leaves = leaves.map(leaf => ethers.keccak256(ethers.toUtf8Bytes(leaf)));
    this.tree = this.buildTree(this.leaves);
  }

  private buildTree(leaves: string[]): string[][] {
    const tree: string[][] = [leaves];
    let level = leaves;

    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const left = level[i];
          const right = level[i + 1];
          const combined = this.combineHashes(left, right);
          nextLevel.push(combined);
        } else {
          nextLevel.push(level[i]);
        }
      }
      tree.push(nextLevel);
      level = nextLevel;
    }

    return tree;
  }

  private combineHashes(left: string, right: string): string {
    const sorted = [left, right].sort();
    return ethers.keccak256(
      ethers.concat([
        ethers.getBytes(sorted[0]),
        ethers.getBytes(sorted[1]),
      ])
    );
  }

  getRoot(): string {
    return this.tree[this.tree.length - 1][0];
  }

  getProof(leaf: string): string[] {
    const index = this.leaves.indexOf(ethers.keccak256(ethers.toUtf8Bytes(leaf)));
    if (index === -1) throw new Error('Leaf not found');

    const proof: string[] = [];
    let currentIndex = index;

    for (let level = 0; level < this.tree.length - 1; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      if (siblingIndex < this.tree[level].length) {
        proof.push(this.tree[level][siblingIndex]);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  verify(leaf: string, proof: string[], root: string): boolean {
    let computedHash = ethers.keccak256(ethers.toUtf8Bytes(leaf));

    for (const sibling of proof) {
      const combined = this.combineHashes(computedHash, sibling);
      computedHash = combined;
    }

    return computedHash === root;
  }

  static async buildFromVotes(votes: string[]): Promise<MerkleTree> {
    return new MerkleTree(votes);
  }
}

export const merkleTreeUtils = {
  createTree: (leaves: string[]) => new MerkleTree(leaves),
  verifyProof: (leaf: string, proof: string[], root: string) => {
    const tree = new MerkleTree([leaf]);
    return tree.verify(leaf, proof, root);
  },
  getRoot: (leaves: string[]) => {
    const tree = new MerkleTree(leaves);
    return tree.getRoot();
  },
};