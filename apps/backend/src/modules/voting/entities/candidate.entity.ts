// backend/src/modules/voting/entities/candidate.entity.ts
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

@ObjectType()
@Entity("candidates")
export class Candidate {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  party: string;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "text" })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  photoHash: string;

  @Field(() => Int)
  @Column({ default: 0 })
  voteCount: number;

  @Field()
  @Column({ default: true })
  active: boolean;

  @Field(() => Int)
  @Column()
  sessionId: number;

  @Field(() => Session)
  @ManyToOne(() => Session, (session) => session.candidates)
  @JoinColumn({ name: "sessionId" })
  session: Session;

  @Field({ nullable: true })
  @Column({ nullable: true, type: "jsonb" })
  metadata: any;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
