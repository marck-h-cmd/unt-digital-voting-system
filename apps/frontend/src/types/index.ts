// frontend/src/types/index.ts
export interface Candidate {
  id: string;
  name: string;
  party: string;
  photoHash: string;
  description: string;
  voteCount: number;
  active: boolean;
}

export interface Session {
  id: number;
  name: string;
  description: string;
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

export interface Vote {
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
  status: 'pending' | 'processing' | 'confirmed' | 'failed';
  createdAt: Date;
}

export interface VoteInput {
  sessionId: number;
  voteHash: string;
  merkleProof: string[];
  zkp: any;
  signature: string;
  candidateId?: string;
  encryptedVote?: string;
}

export interface VoteResponse {
  success: boolean;
  voteHash: string;
  txHash: string;
  blockNumber: number;
  gasCost: string;
  merkleRoot?: string;
  timestamp: string;
}

export interface SessionStats {
  sessionId: number;
  name: string;
  status: string;
  totalVotes: number;
  validVotes: number;
  noiseVotes: number;
  participationRate: number;
  results: CandidateResult[];
  startTime: number;
  endTime: number;
  merkleRoot?: string;
  timestamp: string;
}

export interface CandidateResult {
  candidateId: string;
  name: string;
  party?: string;
  votes: number;
  percentage: number;
}

export interface VerificationResult {
  isValid: boolean;
  checks: {
    onChain: boolean;
    merkleProof: boolean;
    zkpValid: boolean;
    ipfsVerified: boolean;
    confirmed: boolean;
  };
  details: any;
}

export interface ZKPProof {
  proof: {
    a: string[];
    b: string[][];
    c: string[];
  };
  publicSignals: string[];
  type?: 'groth16' | 'pedersen';
}