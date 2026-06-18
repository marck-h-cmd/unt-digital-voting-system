import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationService } from './validation.service';
import { SIUStudent } from '../entities/siu-student.entity';
import { Voter } from '../entities/voter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SIUStudent, Voter])],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
