import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationModule } from './validation/validation.module';
import { FacialModule } from './facial/facial.module';
import { SessionModule } from './session/session.module';
import { IdentityController } from './identity.controller';
import { Voter } from './entities/voter.entity';
import { SIUStudent } from './entities/siu-student.entity';

@Module({
  imports: [
    ValidationModule,
    FacialModule,
    SessionModule,
    TypeOrmModule.forFeature([Voter, SIUStudent]),
  ],
  controllers: [IdentityController],
  exports: [ValidationModule, FacialModule, SessionModule],
})
export class IdentityModule {}
