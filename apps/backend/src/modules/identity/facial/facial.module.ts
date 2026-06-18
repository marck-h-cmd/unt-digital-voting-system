import { Module } from '@nestjs/common';
import { FacialService } from './facial.service';

@Module({
  providers: [FacialService],
  exports: [FacialService],
})
export class FacialModule {}
