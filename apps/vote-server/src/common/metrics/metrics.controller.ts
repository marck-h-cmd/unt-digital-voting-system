// backend/src/common/metrics/metrics.controller.ts
import { Controller, Get } from "@nestjs/common";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getMetrics();
  }

  @Get("stats")
  async getStats() {
    return this.metricsService.getStats();
  }
}
