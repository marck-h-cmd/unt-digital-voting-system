import { Module, Global } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { MetricsModule } from "./metrics/metrics.module";

@Global()
@Module({
  imports: [HealthModule, MetricsModule],
  exports: [HealthModule, MetricsModule],
})
export class CommonModule {}
