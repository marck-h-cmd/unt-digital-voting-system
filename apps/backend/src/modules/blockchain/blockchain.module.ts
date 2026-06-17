// backend/src/modules/blockchain/blockchain.module.ts
import { Module } from "@nestjs/common";
import { BlockchainService } from "./blockchain.service";

@Module({
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
