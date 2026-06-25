// backend/src/common/decorators/rate-limiter.decorator.ts
import { SetMetadata } from "@nestjs/common";

export const RATE_LIMITER_KEY = "rate_limiter";

export interface RateLimiterOptions {
  points: number;
  duration: number;
}

export const RateLimiter = (options: RateLimiterOptions) =>
  SetMetadata(RATE_LIMITER_KEY, options);
