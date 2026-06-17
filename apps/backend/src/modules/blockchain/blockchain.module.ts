// backend/src/modules/blockchain/blockchain.module.ts
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { BlockchainService } from "./blockchain.service";

@Module({
  imports: [
    BullModule.registerQueue({
      name: "blockchain",
    }),
  ],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
