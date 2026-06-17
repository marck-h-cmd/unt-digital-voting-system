// backend/src/modules/zkp/zkp.module.ts
import { Module } from "@nestjs/common";
import { ZKPService } from "./zkp.service";

@Module({
  providers: [ZKPService],
  exports: [ZKPService],
})
export class ZKPModule {}
