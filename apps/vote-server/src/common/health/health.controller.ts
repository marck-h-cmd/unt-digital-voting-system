// backend/src/common/health/health.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/typeorm";
import { Connection } from "typeorm";
import Redis from "ioredis";

@Controller("health")
export class HealthController {
  constructor(
    private configService: ConfigService,
    @InjectConnection() private connection: Connection,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        syscoin: await this.checkSyscoin(),
        ipfs: await this.checkIPFS(),
      },
    };

    const isHealthy = Object.values(health.services).every((s) => s === true);
    if (!isHealthy) {
      health.status = "degraded";
    }

    return health;
  }

  @Get("ready")
  @HttpCode(HttpStatus.OK)
  async checkReadiness() {
    const isReady = (await this.checkDatabase()) && (await this.checkRedis());
    return { ready: isReady };
  }

  @Get("live")
  @HttpCode(HttpStatus.OK)
  checkLiveness() {
    return { live: true };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.connection.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    let redis: Redis | null = null;
    try {
      redis = new Redis({
        host: this.configService.get("REDIS_HOST", "localhost"),
        port: this.configService.get("REDIS_PORT", 6379),
        password: this.configService.get("REDIS_PASSWORD"),
        db: this.configService.get("REDIS_DB", 0),
        connectTimeout: 2000,
      });
      const result = await redis.ping();
      await redis.quit();
      return result === "PONG";
    } catch {
      if (redis) {
        try {
          redis.disconnect();
        } catch {}
      }
      return false;
    }
  }

  private async checkSyscoin(): Promise<boolean> {
    try {
      const response = await fetch(this.configService.get("SYSCOIN_RPC_URL"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "net_version",
          params: [],
          id: 1,
        }),
      });
      const data = await response.json();
      return data.result === "57057";
    } catch {
      return false;
    }
  }

  private async checkIPFS(): Promise<boolean> {
    try {
      const response = await fetch(
        `http://${this.configService.get("IPFS_HOST")}:${this.configService.get("IPFS_PORT")}/api/v0/version`,
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
