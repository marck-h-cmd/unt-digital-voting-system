// backend/src/modules/voting/dto/vote.response.ts
import { ObjectType, Field, Int } from "@nestjs/graphql";
import { GraphQLJSON } from "../../../common/scalars/json.scalar";

@ObjectType()
export class VoteResponse {
  @Field()
  success: boolean;

  @Field()
  voteHash: string;

  @Field()
  txHash: string;

  @Field(() => Int)
  blockNumber: number;

  @Field()
  gasCost: string;

  @Field({ nullable: true })
  merkleRoot?: string;

  @Field()
  timestamp: string;
}

@ObjectType()
export class CandidateResult {
  @Field()
  candidateId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  party?: string;

  @Field(() => Int)
  votes: number;

  @Field()
  percentage: number;
}

@ObjectType()
export class SessionStats {
  @Field(() => Int)
  sessionId: number;

  @Field()
  name: string;

  @Field()
  status: string;

  @Field(() => Int)
  totalVotes: number;

  @Field(() => Int)
  validVotes: number;

  @Field(() => Int)
  noiseVotes: number;

  @Field()
  participationRate: number;

  @Field(() => [CandidateResult])
  results: CandidateResult[];

  @Field(() => Int)
  startTime: number;

  @Field(() => Int)
  endTime: number;

  @Field({ nullable: true })
  merkleRoot?: string;

  @Field()
  timestamp: string;
}

@ObjectType()
export class VerificationCheck {
  @Field()
  onChain: boolean;

  @Field()
  merkleProof: boolean;

  @Field()
  zkpValid: boolean;

  @Field()
  ipfsVerified: boolean;

  @Field()
  confirmed: boolean;
}

@ObjectType()
export class VerificationResult {
  @Field()
  isValid: boolean;

  @Field(() => VerificationCheck)
  checks: VerificationCheck;

  @Field(() => GraphQLJSON, { nullable: true })
  details: any;
}
