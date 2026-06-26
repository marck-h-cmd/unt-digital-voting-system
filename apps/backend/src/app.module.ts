// backend/src/app.module.ts
import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, getRepositoryToken, InjectRepository } from "@nestjs/typeorm";
import { GraphQLModule } from "@nestjs/graphql";
import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { BullModule } from "@nestjs/bull";
import { ScheduleModule } from "@nestjs/schedule";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { Repository } from "typeorm";

import { VotingModule } from "./modules/voting/voting.module";
import { ZKPModule } from "./modules/zkp/zkp.module";
import { BlockchainModule } from "./modules/blockchain/blockchain.module";
import { MerkleModule } from "./modules/merkle/merkle.module";
import { CommonModule } from "./common/common.module";
import { HealthModule } from "./common/health/health.module";
import { MetricsModule } from "./common/metrics/metrics.module";
import { IdentityModule } from "./modules/identity/identity.module";

import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

import configuration from "./config/configuration";
import { typeormConfig } from "./config/typeorm.config";
import { bullConfig } from "./config/bull.config";

import { Session } from "./modules/voting/entities/session.entity";
import { Candidate } from "./modules/voting/entities/candidate.entity";
import { Vote } from "./modules/voting/entities/vote.entity";
import { SIUStudent } from "./modules/identity/entities/siu-student.entity";

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
    TypeOrmModule.forFeature([Session, Candidate, Vote, SIUStudent]),

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
    IdentityModule,
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
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(
    @InjectRepository(Session)
    private readonly sessionRepo: Repository<Session>,
    @InjectRepository(Candidate)
    private readonly candidateRepo: Repository<Candidate>,
    @InjectRepository(Vote)
    private readonly voteRepo: Repository<Vote>,
    @InjectRepository(SIUStudent)
    private readonly siuStudentRepo: Repository<SIUStudent>,
  ) {}

  async onModuleInit() {
    await this.runSeed();
  }

  private async runSeed() {
    try {
      // Check if there are existing sessions
      this.logger.log("Checking for existing sessions...");
      const existingSessions = await this.sessionRepo.count();
      this.logger.log(`Found ${existingSessions} existing sessions.`);

      if (existingSessions > 0) {
        this.logger.log("Ya existen datos en la base de datos, saltando seeding.");
        
        // Debug: let's log what's in the sessions table
        const sessions = await this.sessionRepo.find();
        this.logger.log("Current sessions:", JSON.stringify(sessions, null, 2));
        return;
      }

      this.logger.log("Iniciando seeding de la base de datos...");

      // Insert session with ID 1
      const currentTime = Math.floor(Date.now() / 1000);
      const oneMonthLater = currentTime + 30 * 24 * 60 * 60;

      this.logger.log("Creating main session...");
      // We use query builder to set id explicitly
      await this.sessionRepo
        .createQueryBuilder()
        .insert()
        .into("sessions")
        .values({
          id: 1, // Explicitly set ID to 1
          name: 'Elecciones Universitarias UNT 2026',
          description: 'Elección para la asamblea universitaria y centros de estudiantes mediante sistema criptográfico.',
          startTime: currentTime,
          endTime: oneMonthLater,
          active: true,
          finalized: false,
          totalVotes: 0,
          validVotes: 0,
          noiseVotes: 0,
        })
        .execute();

      // Fetch the saved session
      const savedSession = await this.sessionRepo.findOne({ where: { id: 1 } });
      if (!savedSession) {
        throw new Error("Failed to save session with ID 1");
      }
      this.logger.log("Sesión electoral creada exitosamente! ID:", savedSession.id);

      // Insert candidates
      this.logger.log("Creating candidates...");
      const candidates = [
        this.candidateRepo.create({
          name: 'Dra. María Elena',
          party: 'Frente Universitario (FU)',
          description: 'Postula al rectorado con una propuesta de modernización tecnológica e infraestructura.',
          session: savedSession,
          active: true,
        }),
        this.candidateRepo.create({
          name: 'Dr. Carlos Mendoza',
          party: 'Movimiento Estudiantil UNT (MEU)',
          description: 'Enfocado en la investigación académica, becas internacionales y bienestar estudiantil.',
          session: savedSession,
          active: true,
        }),
        this.candidateRepo.create({
          name: 'Dr. Luis Paredes',
          party: 'Alianza Universitaria (AU)',
          description: 'Promueve la descentralización de recursos y mejora de las facultades de ingeniería y salud.',
          session: savedSession,
          active: true,
        })
      ];

      const savedCandidates = await this.candidateRepo.save(candidates);
      this.logger.log(`Candidatos creados exitosamente! Count: ${savedCandidates.length}`);

      // Insert SIU students
      this.logger.log("Creating SIU students...");
      const students = [
        { dni: '12345678', carnet: '2020123456', fullName: 'Juan Perez', email: 'juanperez@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '87654321', carnet: '2021654321', fullName: 'Maria Rodriguez', email: 'mariarodriguez@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '11223344', carnet: '2022112233', fullName: 'Carlos Gomez', email: 'carlosgomez@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '61002639', carnet: '2018610026', fullName: 'Ana Lucia Diaz', email: 'analuciadiaz@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '98765432', carnet: '2019987654', fullName: 'Diego Fernando Lopez', email: 'diegolopez@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '44332211', carnet: '2023443322', fullName: 'Sofia Martinez', email: 'sofiarmartinez@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '55667788', carnet: '2024556677', fullName: 'Jose Miguel Torres', email: 'josemigueltorres@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '13579246', carnet: '2017135792', fullName: 'Valentina Quispe', email: 'valentinaquispe@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '24681357', carnet: '2016246813', fullName: 'Rodrigo Huaman', email: 'rodrigohuaman@unitru.edu.pe', status: 'ENROLLED' },
        { dni: '35792468', carnet: '2025357924', fullName: 'Camila Soto', email: 'camilasoto@unitru.edu.pe', status: 'ENROLLED' },
      ];

      const studentEntities = students.map(s => this.siuStudentRepo.create(s));
      const savedStudents = await this.siuStudentRepo.save(studentEntities);
      this.logger.log(`Estudiantes SIU creados exitosamente! Count: ${savedStudents.length}`);

      this.logger.log("Seeding completado con éxito!");

    } catch (error) {
      this.logger.error("Error durante el seeding:", error);
      if (error instanceof Error) {
        this.logger.error("Error message:", error.message);
        this.logger.error("Error stack:", error.stack);
      }
    }
  }
}
