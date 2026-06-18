import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionService } from './session.service';
import { AuthSession } from '../entities/auth-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuthSession]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'super-secret-key-for-hackathon-2026'),
        signOptions: { expiresIn: '5m' },
      }),
    }),
  ],
  providers: [SessionService],
  exports: [SessionService, JwtModule],
})
export class SessionModule {}
