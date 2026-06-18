import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacialService } from './facial.service';
import { Voter } from '../entities/voter.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Voter])],
  providers: [FacialService],
  exports: [FacialService],
})
export class FacialModule {}
