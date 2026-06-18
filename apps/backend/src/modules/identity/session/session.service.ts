import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthSession, SessionStatus } from '../entities/auth-session.entity';
import { Voter } from '../entities/voter.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(AuthSession)
    private readonly sessionRepo: Repository<AuthSession>,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(voter: Voter, facialScore: number): Promise<string> {
    const payload = { sub: voter.id, role: voter.role };
    const token = this.jwtService.sign(payload, { expiresIn: '5m' });
    
    const session = this.sessionRepo.create({
      sessionToken: token,
      voterId: voter.id,
      facialScore: facialScore,
      status: SessionStatus.ACTIVE,
      expiredAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });
    await this.sessionRepo.save(session);
    
    return token;
  }

  async validateSession(token: string): Promise<AuthSession> {
    try {
      this.jwtService.verify(token);
      const session = await this.sessionRepo.findOne({ where: { sessionToken: token } });
      
      if (!session) {
        throw new UnauthorizedException('Session not found');
      }
      
      if (session.status !== SessionStatus.ACTIVE) {
        throw new UnauthorizedException('Session is no longer active');
      }
      
      if (new Date() > session.expiredAt) {
        session.status = SessionStatus.EXPIRED;
        await this.sessionRepo.save(session);
        throw new UnauthorizedException('Session expired');
      }
      
      return session;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  async consumeSession(token: string): Promise<void> {
    const session = await this.validateSession(token);
    session.status = SessionStatus.USED;
    session.usedAt = new Date();
    await this.sessionRepo.save(session);
  }
}
