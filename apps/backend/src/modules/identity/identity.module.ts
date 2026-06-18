import { Module } from '@nestjs/common';
import { ValidationModule } from './validation/validation.module';
import { FacialModule } from './facial/facial.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [ValidationModule, FacialModule, SessionModule],
  exports: [ValidationModule, FacialModule, SessionModule],
})
export class IdentityModule {}
