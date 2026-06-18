import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum VoterRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
}

@Entity('voters')
export class Voter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  dniHash: string;

  @Column({ nullable: true })
  carnetHash: string;

  @Column({ nullable: true })
  emailHash: string;

  @Column({
    type: 'varchar',
    default: VoterRole.STUDENT,
  })
  role: VoterRole;

  @Column({ nullable: true })
  facialReferencePath: string;

  @Column({ nullable: true })
  facialReferenceHash: string;

  @Column({ default: false })
  hasVoted: boolean;

  @Column({ nullable: true })
  votedAt: Date;

  @Column({ default: 0 })
  failedAttempts: number;

  @Column({ nullable: true })
  lockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
