import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voter } from '../entities/voter.entity';

@Injectable()
export class FacialService {
  private deepfaceUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Voter)
    private readonly voterRepo: Repository<Voter>,
  ) {
    this.deepfaceUrl = this.configService.get<string>('DEEPFACE_URL', 'http://deepface-service:5000');
  }

  async extractEmbedding(imgBase64: string): Promise<number[]> {
    // Mocked embedding - return array of 512 zeros for testing
    const embedding = Array(512).fill(0);
    return embedding;
  }

  async identifyFace(imgBase64: string, dni: string): Promise<Voter> {
    // Mocked identification - just return the voter with this DNI (skip actual face matching)
    const voter = await this.voterRepo.findOne({ where: { dniHash: dni } });
    if (!voter) {
      throw new BadRequestException('Voter not found. Please validate your identity first.');
    }

    if (!voter.facialEmbeddings || voter.facialEmbeddings.length === 0) {
      throw new BadRequestException('No facial data found for this voter. Please validate your identity again.');
    }

    return voter;
  }

  async verifyFace(img1Base64: string, img2Url: string): Promise<number> {
    // Mocked verification, return a high confidence score
    return 0.95;
  }

  async verifyLiveness(imgBase64: string): Promise<boolean> {
    // Temporarily disabled for testing
    return true;
  }
}
