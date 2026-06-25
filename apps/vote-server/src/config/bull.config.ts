// backend/src/config/bull.config.ts
import { BullModuleOptions } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config";

export const bullConfig = (
  configService: ConfigService,
): BullModuleOptions => ({
  redis: {
    host: configService.get("REDIS_HOST"),
    port: configService.get("REDIS_PORT"),
    password: configService.get("REDIS_PASSWORD"),
    db: configService.get("REDIS_DB") || 0,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  },
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
  limiter: {
    max: 100,
    duration: 1000,
  },
});
