import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ValidationService } from './validation/validation.service';
import { FacialService } from './facial/facial.service';
import { SessionService } from './session/session.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voter, VoterRole } from './entities/voter.entity';
import { SIUStudent } from './entities/siu-student.entity';

@Controller('identity')
export class IdentityController {
  constructor(
    private readonly validationService: ValidationService,
    private readonly facialService: FacialService,
    private readonly sessionService: SessionService,
    @InjectRepository(Voter)
    private readonly voterRepo: Repository<Voter>,
    @InjectRepository(SIUStudent)
    private readonly siuRepo: Repository<SIUStudent>,
  ) {}

  @Post('validate-dni')
  async validateDNI(
    @Body() body: { dni: string; dniPhotoBase64: string; role?: VoterRole },
  ) {
    const { dni, dniPhotoBase64, role = VoterRole.STUDENT } = body;

    let voter = await this.voterRepo.findOne({ where: { dniHash: dni } });

    if (!voter) {
      let student: SIUStudent | null = null;
      if (role === VoterRole.STUDENT) {
        student = await this.siuRepo.findOne({ where: { dni } });
      }

      voter = this.voterRepo.create({
        dniHash: dni,
        role: role,
        carnetHash: student?.carnet,
        facialEmbeddings: [],
      });
    }

    const embedding = await this.facialService.extractEmbedding(dniPhotoBase64);
    voter.facialEmbeddings = [...(voter.facialEmbeddings || []), embedding];
    await this.voterRepo.save(voter);

    return {
      status: 'success',
      message: 'Identity validated and facial pattern stored',
      voterId: voter.id,
    };
  }

  @Post('verify-face')
  async verifyFace(
    @Body() body: { facePhotoBase64: string; dni: string },
  ) {
    const { facePhotoBase64, dni } = body;

    await this.facialService.verifyLiveness(facePhotoBase64);
    const voter = await this.facialService.identifyFace(facePhotoBase64, dni); // Pass dni to identifyFace!
    const token = await this.sessionService.createSession(voter, 1.0);
    const nullifierHash = `0x${Buffer.from(voter.id).toString('hex')}`;

    return {
      status: 'success',
      token,
      nullifierHash,
      voter: {
        id: voter.id,
        role: voter.role,
      },
    };
  }
}
