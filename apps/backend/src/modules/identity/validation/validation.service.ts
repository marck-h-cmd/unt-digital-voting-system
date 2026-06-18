import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SIUStudent } from '../entities/siu-student.entity';
import { Voter, VoterRole } from '../entities/voter.entity';

@Injectable()
export class ValidationService {
  constructor(
    @InjectRepository(SIUStudent)
    private readonly siuRepo: Repository<SIUStudent>,
    @InjectRepository(Voter)
    private readonly voterRepo: Repository<Voter>,
  ) {}

  async validateDNI(dni: string): Promise<boolean> {
    // TODO: Integrate with real RENIEC API here
    if (!/^[0-9]{8}$/.test(dni)) {
      throw new BadRequestException('Invalid DNI format');
    }
    return true; 
  }

  async validateStudent(dni: string, carnet: string): Promise<SIUStudent> {
    await this.validateDNI(dni);

    const student = await this.siuRepo.findOne({ where: { dni, carnet } });
    if (!student) {
      throw new BadRequestException('Student not found in SIU database or credentials mismatch');
    }
    if (student.status !== 'ENROLLED') {
      throw new BadRequestException('Student is not actively enrolled');
    }

    return student;
  }

  async getOrCreateVoter(student: SIUStudent): Promise<Voter> {
    // Note: In production, we must hash these values. 
    // Kept plain for the hackathon demo visibility.
    const dniHash = student.dni; 
    const carnetHash = student.carnet;

    let voter = await this.voterRepo.findOne({ where: { dniHash } });
    if (!voter) {
      voter = this.voterRepo.create({
        dniHash,
        carnetHash,
        role: VoterRole.STUDENT,
        hasVoted: false,
      });
      await this.voterRepo.save(voter);
    }

    if (voter.hasVoted) {
      throw new BadRequestException('Voter has already cast a vote');
    }

    return voter;
  }
}
