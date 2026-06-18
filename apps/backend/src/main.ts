// backend/src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe, VersioningType, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ExpressAdapter } from "@nestjs/platform-express";
import * as express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `${timestamp} [${context}] ${level}: ${message}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: "logs/combined.log",
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });

  const configService = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // Middleware de seguridad
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: [
            "'self'",
            "https://rpc.syscoin.org",
            "https://api.syscoin.org",
          ],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https://gateway.ipfs.io"],
          frameSrc: ["'self'", "https://sysscan.io"],
        },
      },
    }),
  );

  app.use(
    compression({
      level: 6,
      threshold: 100 * 1024, // 100KB
    }),
  );

  app.use(cookieParser());

  // Aumentar el límite de payload para permitir fotos Base64 a DeepFace
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100, // 100 requests por IP
      message:
        "Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.",
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get("CORS_ORIGIN", "*"),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-request-id",
      "x-api-key",
    ],
    exposedHeaders: ["x-request-id", "x-rate-limit-remaining"],
    maxAge: 86400, // 24 horas
  });

  // Versionamiento de API (disabled for now)
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: "1",
  //   prefix: "v",
  // });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
      stopAtFirstError: true,
    }),
  );

  // Prefijo global
  app.setGlobalPrefix("api", {
    exclude: ["health", "metrics", "docs"],
  });

  // Configurar puerto
  const port = configService.get("PORT", 3000);
  const host = configService.get("HOST", "0.0.0.0");

  await app.listen(port, host);

  logger.log(`🚀 Servidor corriendo en http://${host}:${port}`);
  logger.log(`📊 GraphQL disponible en http://${host}:${port}/graphql`);
  logger.log(`🔗 Conectado a Syscoin ${configService.get("SYSCOIN_NETWORK")}`);
  logger.log(`📝 Contrato: ${configService.get("CONTRACT_ADDRESS")}`);

  // Manejo de señales
  process.on("SIGTERM", async () => {
    logger.warn("SIGTERM recibido, cerrando aplicación...");
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    logger.warn("SIGINT recibido, cerrando aplicación...");
    await app.close();
    process.exit(0);
  });
}

bootstrap();
