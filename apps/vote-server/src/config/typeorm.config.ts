// backend/src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";

export const typeormConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: "postgres",
  host: configService.get("DB_HOST"),
  port: configService.get("DB_PORT"),
  username: configService.get("DB_USERNAME"),
  password: configService.get("DB_PASSWORD"),
  database: configService.get("DB_DATABASE"),
  entities: [__dirname + "/../**/*.entity{.ts,.js}"],
  synchronize: configService.get("NODE_ENV") !== "production",
  logging: configService.get("NODE_ENV") === "development",
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
  migrationsRun: configService.get("NODE_ENV") === "production",
  ssl: configService.get("DB_SSL") === "true",
  extra: {
    max: 100,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});
