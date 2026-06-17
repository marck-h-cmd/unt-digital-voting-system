// backend/src/modules/voting/entities/vote.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { Session } from "./session.entity";
import { Candidate } from "./candidate.entity";
import { GraphQLJSON } from "../../../common/scalars/json.scalar";

@ObjectType()
@Entity("votes")
export class Vote {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column({ unique: true })
  voteHash: string;

  @Field(() => Int)
  @Column()
  sessionId: number;

  @Field(() => Session)
  @ManyToOne(() => Session, (session) => session.votes)
  @JoinColumn({ name: "sessionId" })
  session: Session;

  @Field(() => Candidate, { nullable: true })
  @ManyToOne(() => Candidate, { nullable: true })
  @JoinColumn({ name: "candidateId" })
  candidate: Candidate;

  @Field({ nullable: true })
  @Column({ nullable: true })
  candidateId: string;

  @Field()
  @Column()
  voterAddress: string;

  @Field()
  @Column()
  voterPublicKey: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  encryptedVote: string;

  @Field()
  @Column()
  isReal: boolean;

  @Field()
  @Column({ default: false })
  zkpValid: boolean;

  @Field(() => GraphQLJSON, { nullable: true })
  @Column({ nullable: true, type: "jsonb" })
  zkpProof: any;

  @Field()
  @Column({ default: false })
  merkleVerified: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  merkleProof: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipfsHash: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  txHash: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  blockNumber: number;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "decimal", precision: 20, scale: 10 })
  gasCost: string;

  @Field()
  @Column({ default: "pending" })
  status: string; // pending, confirmed, failed

  @Field(() => Int)
  @Column({ default: 0 })
  confirmations: number;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
