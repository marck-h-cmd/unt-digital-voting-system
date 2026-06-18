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
    try {
      const response = await fetch(`${this.deepfaceUrl}/api/face/extract-embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img_base64: imgBase64 })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new BadRequestException(errorData.error || 'Failed to extract embedding');
      }

      const data = await response.json() as any;
      return data.embedding;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error contacting deepface service: ' + e.message);
    }
  }

  async identifyFace(imgBase64: string, dni: string): Promise<Voter> {
    try {
      // Find only the voter with this DNI!
      const voter = await this.voterRepo.findOne({ where: { dniHash: dni } });
      if (!voter) {
        throw new BadRequestException('Voter not found. Please validate your identity first.');
      }

      if (!voter.facialEmbeddings || voter.facialEmbeddings.length === 0) {
        throw new BadRequestException('No facial data found for this voter. Please validate your identity again.');
      }

      const registeredEmbeddings = [{ id: voter.id, embeddings: voter.facialEmbeddings }];

      const response = await fetch(`${this.deepfaceUrl}/api/face/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          img_base64: imgBase64, 
          registered_embeddings: registeredEmbeddings 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new BadRequestException(errorData.error || 'Failed to identify face');
      }

      const data = await response.json() as any;
      if (data.status === 'error') {
        throw new BadRequestException(data.message || 'Face does not match. Please try again.');
      }

      return voter;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error identifying face: ' + e.message);
    }
  }

  async verifyFace(img1Base64: string, img2Url: string): Promise<number> {
    try {
      const response = await fetch(`${this.deepfaceUrl}/api/face/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img1_base64: img1Base64, img2_url: img2Url })
      });

      if (!response.ok) {
        throw new Error(`Deepface service error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      if (!data.verified) {
        throw new BadRequestException('Facial verification failed. Face does not match reference.');
      }

      return data.score; // Confidence score
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error contacting deepface service: ' + e.message);
    }
  }

  async verifyLiveness(imgBase64: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.deepfaceUrl}/api/face/liveness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ img_base64: imgBase64 })
      });

      if (!response.ok) return false;

      const data = await response.json() as any;
      if (!data.is_real) {
        throw new BadRequestException('Liveness check failed. Please show a real face.');
      }
      return true;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new InternalServerErrorException('Error checking liveness: ' + e.message);
    }
  }
}
