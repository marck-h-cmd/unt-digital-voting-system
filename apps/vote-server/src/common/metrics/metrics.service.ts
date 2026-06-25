import { Injectable } from "@nestjs/common";
import * as client from "prom-client";

@Injectable()
export class MetricsService {
  constructor() {
    // Inicializar las métricas por defecto de prom-client si no están inicializadas
    client.collectDefaultMetrics({ register: client.register });
  }

  async getMetrics(): Promise<string> {
    return client.register.metrics();
  }

  async getStats(): Promise<any> {
    const memoryUsage = process.memoryUsage();
    return {
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024) + " MB",
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + " MB",
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + " MB",
        external: Math.round(memoryUsage.external / 1024 / 1024) + " MB",
      },
      cpu: process.cpuUsage(),
      timestamp: new Date().toISOString(),
    };
  }
}
