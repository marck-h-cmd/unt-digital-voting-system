// backend/src/modules/voting/dto/vote.input.ts
import { InputType, Field, Int, ID } from "@nestjs/graphql";
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

@InputType()
export class ZKPInput {
  @Field(() => [String])
  @IsString({ each: true })
  a: string[];

  @Field(() => [[String]])
  @IsString({ each: true })
  b: string[][];

  @Field(() => [String])
  @IsString({ each: true })
  c: string[];

  @Field(() => [String])
  @IsString({ each: true })
  input: string[];
}

@InputType()
export class CastVoteInput {
  @Field(() => Int)
  @IsNumber()
  sessionId: number;

  @Field()
  @IsString()
  voteHash: string;

  @Field(() => [String])
  @IsString({ each: true })
  merkleProof: string[];

  @Field(() => ZKPInput)
  @ValidateNested()
  @Type(() => ZKPInput)
  zkp: ZKPInput;

  @Field()
  @IsString()
  sessionToken: string;

  @Field()
  @IsString()
  nullifierHash: string;

  @Field(() => Int)
  @IsNumber()
  candidateId: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  encryptedVote?: string;
}

@InputType()
export class CreateSessionInput {
  @Field()
  @IsString()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => Int)
  @IsNumber()
  startTime: number;

  @Field(() => Int)
  @IsNumber()
  endTime: number;

  @Field(() => [String])
  @IsString({ each: true })
  candidateNames: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  candidateParties?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  candidateDescriptions?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString({ each: true })
  candidatePhotos?: string[];
}

@InputType()
export class VerifyVoteInput {
  @Field(() => Int)
  @IsNumber()
  sessionId: number;

  @Field()
  @IsString()
  voteHash: string;

  @Field(() => [String])
  @IsString({ each: true })
  merkleProof: string[];
}
