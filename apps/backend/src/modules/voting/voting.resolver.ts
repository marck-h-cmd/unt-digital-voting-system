// backend/src/modules/voting/voting.resolver.ts
import {
  Resolver,
  Query,
  Mutation,
  Args,
  Subscription,
  ID,
  Int,
  Context,
} from "@nestjs/graphql";
import { UseGuards, UseInterceptors } from "@nestjs/common";
import { PubSub } from "graphql-subscriptions";

import { VotingService } from "./voting.service";
import { Vote } from "./entities/vote.entity";
import { Session } from "./entities/session.entity";
import { Candidate } from "./entities/candidate.entity";
import {
  CastVoteInput,
  CreateSessionInput,
  VerifyVoteInput,
} from "./dto/vote.input";
import {
  VoteResponse,
  SessionStats,
  VerificationResult,
} from "./dto/vote.response";
import { GqlAuthGuard } from "../../common/guards/gql-auth.guard";
import { RateLimiter } from "../../common/decorators/rate-limiter.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

const pubSub = new PubSub();

@Resolver()
export class VotingResolver {
  constructor(private readonly votingService: VotingService) {}

  // ============ QUERIES ============

  @Query(() => [Candidate])
  async candidates(
    @Args("sessionId", { type: () => Int }) sessionId: number,
  ): Promise<Candidate[]> {
    return this.votingService.getCandidates(sessionId);
  }

  @Query(() => Session)
  async session(@Args("id", { type: () => Int }) id: number): Promise<Session> {
    return this.votingService.getSession(id);
  }

  @Query(() => [Session])
  async sessions(): Promise<Session[]> {
    return this.votingService.getSessions();
  }

  @Query(() => Vote)
  async vote(@Args("voteHash") voteHash: string): Promise<Vote> {
    return this.votingService.getVote(voteHash);
  }

  @Query(() => [Vote])
  async votes(
    @Args("sessionId", { type: () => Int }) sessionId: number,
    @Args("isReal", { type: () => Boolean, nullable: true }) isReal?: boolean,
  ): Promise<Vote[]> {
    return this.votingService.getVotes(sessionId, isReal);
  }

  @Query(() => SessionStats)
  async sessionStats(
    @Args("sessionId", { type: () => Int }) sessionId: number,
  ): Promise<SessionStats> {
    return this.votingService.getSessionStats(sessionId);
  }

  @Query(() => VerificationResult)
  async verifyVote(
    @Args("input") input: VerifyVoteInput,
  ): Promise<VerificationResult> {
    return this.votingService.verifyVote(input);
  }

  @Query(() => Boolean)
  async hasVoted(
    @Args("sessionId", { type: () => Int }) sessionId: number,
    @Args("nullifierHash") nullifierHash: string,
  ): Promise<boolean> {
    return this.votingService.hasVotedByNullifier(sessionId, nullifierHash);
  }

  // ============ MUTATIONS ============

  @Mutation(() => VoteResponse)
  @UseGuards(GqlAuthGuard)
  @RateLimiter({ points: 1, duration: 60 }) // 1 voto por minuto
  async castVote(
    @Args("input") input: CastVoteInput,
    @Context() context: any,
    @CurrentUser() user: any,
  ): Promise<VoteResponse> {
    const result = await this.votingService.castVote(input, user);

    // Publicar evento en tiempo real
    pubSub.publish("voteCast", {
      voteCast: result,
    });

    return result;
  }

  @Mutation(() => Session)
  @UseGuards(GqlAuthGuard)
  async createSession(
    @Args("input") input: CreateSessionInput,
    @CurrentUser() user: any,
  ): Promise<Session> {
    return this.votingService.createSession(input, user);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async finalizeSession(
    @Args("sessionId", { type: () => Int }) sessionId: number,
    @CurrentUser() user: any,
  ): Promise<boolean> {
    return this.votingService.finalizeSession(sessionId, user);
  }

  // ============ SUBSCRIPTIONS ============

  @Subscription(() => VoteResponse)
  voteCast() {
    return pubSub.asyncIterator("voteCast");
  }

  @Subscription(() => SessionStats)
  sessionUpdated(@Args("sessionId", { type: () => Int }) sessionId: number) {
    return pubSub.asyncIterator(`sessionUpdated:${sessionId}`);
  }
}
