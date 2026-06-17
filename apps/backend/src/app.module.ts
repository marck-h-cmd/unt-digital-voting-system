// backend/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { VotingModule } from "./modules/voting/voting.module";
import { ZKPModule } from "./modules/zkp/zkp.module";
import { BlockchainModule } from "./modules/blockchain/blockchain.module";
import { MerkleModule } from "./modules/merkle/merkle.module";
import { CommonModule } from "./common/common.module";
import { HealthModule } from "./common/health/health.module";
import { MetricsModule } from "./common/metrics/metrics.module";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

import configuration from "./config/configuration";
import { typeormConfig } from "./config/typeorm.config";
import { bullConfig } from "./config/bull.config";

@Module({
  imports: [
    // Configuración
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [".env", ".env.local", ".env.production"],
      validationSchema: null,
      validationOptions: {
        abortEarly: true,
      },
    }),

    // Base de datos
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        typeormConfig(configService),
    }),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: "schema.gql",
        path: "/graphql",
        playground: configService.get("NODE_ENV") !== "production",
        introspection: configService.get("NODE_ENV") !== "production",
        debug: configService.get("NODE_ENV") !== "production",
        cors: true,
        context: ({ req }) => ({ req }),
        formatError: (error) => {
          return {
            message: error.message,
            code: error.extensions?.code || "INTERNAL_SERVER_ERROR",
            path: error.path,
            timestamp: new Date().toISOString(),
            details: error.extensions?.exception,
          };
        },
        plugins: [],
        subscriptions: {
          "graphql-ws": true,
          "subscriptions-transport-ws": true,
        },
      }),
    }),

    // Bull/Redis
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => bullConfig(configService),
    }),

    // Schedule
    ScheduleModule.forRoot(),

    // Módulos personalizados
    VotingModule,
    ZKPModule,
    BlockchainModule,
    MerkleModule,
    CommonModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
