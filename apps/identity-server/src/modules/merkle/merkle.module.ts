// backend/src/modules/merkle/merkle.module.ts
import { Module } from "@nestjs/common";
import { MerkleService } from "./merkle.service";

@Module({
  providers: [MerkleService],
  exports: [MerkleService],
})
export class MerkleModule {}
