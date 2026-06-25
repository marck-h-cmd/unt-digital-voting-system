// backend/src/modules/voting/voting.module.ts
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bull";

import { VotingService } from "./voting.service";
import { VotingResolver } from "./voting.resolver";
import { Vote } from "./entities/vote.entity";
import { Session } from "./entities/session.entity";
import { Candidate } from "./entities/candidate.entity";
import { VotingConsumer } from "./voting.consumer";

import { ZKPModule } from "../zkp/zkp.module";
import { BlockchainModule } from "../blockchain/blockchain.module";
import { MerkleModule } from "../merkle/merkle.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, Session, Candidate]),
    BullModule.registerQueue({
      name: "voting",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        timeout: 30000,
      },
    }),
    BullModule.registerQueue({
      name: "blockchain",
    }),
    ZKPModule,
    BlockchainModule,
    MerkleModule,
    IdentityModule,
  ],
  providers: [VotingService, VotingResolver, VotingConsumer],
  exports: [VotingService],
})
export class VotingModule {}
