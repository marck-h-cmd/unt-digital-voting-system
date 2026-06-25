// backend/src/common/interfaces/vote.interface.ts
export interface IVote {
  voteHash: string;
  sessionId: number;
  voterAddress: string;
  candidateId?: string;
  isReal: boolean;
  zkpValid: boolean;
  merkleVerified: boolean;
  ipfsHash?: string;
  txHash?: string;
  blockNumber?: number;
  gasCost?: string;
  status: "pending" | "processing" | "confirmed" | "failed";
  timestamp: Date;
}

export interface ISession {
  id: number;
  name: string;
  description?: string;
  startTime: number;
  endTime: number;
  active: boolean;
  finalized: boolean;
  totalVotes: number;
  validVotes: number;
  noiseVotes: number;
  merkleRoot?: string;
  resultHash?: string;
}

export interface IZKPProof {
  a: string[];
  b: string[][];
  c: string[];
  input: string[];
}
