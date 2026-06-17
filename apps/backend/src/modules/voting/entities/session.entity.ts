// backend/src/modules/voting/entities/session.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { ObjectType, Field, ID, Int } from "@nestjs/graphql";
import { Vote } from "./vote.entity";
import { Candidate } from "./candidate.entity";

@ObjectType()
@Entity("sessions")
export class Session {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "text" })
  description: string;

  @Field(() => Int)
  @Column({ type: "bigint" })
  startTime: number;

  @Field(() => Int)
  @Column({ type: "bigint" })
  endTime: number;

  @Field()
  @Column({ default: true })
  active: boolean;

  @Field()
  @Column({ default: false })
  finalized: boolean;

  @Field(() => Int)
  @Column({ default: 0 })
  totalVotes: number;

  @Field(() => Int)
  @Column({ default: 0 })
  validVotes: number;

  @Field(() => Int)
  @Column({ default: 0 })
  noiseVotes: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  merkleRoot: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  resultHash: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ipfsSessionHash: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "jsonb" })
  metadata: any;

  @Field(() => [Vote])
  @OneToMany(() => Vote, (vote) => vote.session)
  votes: Vote[];

  @Field(() => [Candidate])
  @OneToMany(() => Candidate, (candidate) => candidate.session)
  candidates: Candidate[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
