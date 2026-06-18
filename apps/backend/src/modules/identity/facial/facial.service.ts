import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacialService {
  private deepfaceUrl: string;

  constructor(private configService: ConfigService) {
    this.deepfaceUrl = this.configService.get<string>('DEEPFACE_URL', 'http://deepface-service:5000');
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
