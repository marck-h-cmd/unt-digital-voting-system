import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('siu_students')
export class SIUStudent {
  @PrimaryColumn()
  dni: string;

  @Column()
  carnet: string;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  status: string; // 'ENROLLED', 'GRADUATED'

  @Column({ nullable: true })
  facialReferenceUrl: string;
}
