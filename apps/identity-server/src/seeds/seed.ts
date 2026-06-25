import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Session } from '../modules/voting/entities/session.entity';
import { Candidate } from '../modules/voting/entities/candidate.entity';
import { Vote } from '../modules/voting/entities/vote.entity';

// Cargar variables de entorno (asume que se ejecuta desde apps/backend)
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'unt_voting',
  entities: [Session, Candidate, Vote],
  synchronize: false,
});

async function runSeed() {
  try {
    console.log('Conectando a la base de datos...');
    await AppDataSource.initialize();
    console.log('¡Conectado!');

    // Limpiar tablas antes de insertar
    console.log('Limpiando tablas (TRUNCATE CASCADE)...');
    await AppDataSource.query('TRUNCATE TABLE votes, candidates, sessions CASCADE');

    console.log('Insertando Sesión Electoral...');
    const sessionRepo = AppDataSource.getRepository(Session);
    
    const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
    const oneMonthLater = currentTime + 30 * 24 * 60 * 60; // 30 days in seconds

    const mainSession = sessionRepo.create({
      name: 'Elecciones Universitarias UNT 2026',
      description: 'Elección para la asamblea universitaria y centros de estudiantes mediante sistema criptográfico.',
      startTime: currentTime,
      endTime: oneMonthLater,
      active: true,
      finalized: false,
      totalVotes: 0,
      validVotes: 0,
      noiseVotes: 0,
    });
    
    await sessionRepo.save(mainSession);

    console.log('Insertando Candidatos de la UNT...');
    const candidateRepo = AppDataSource.getRepository(Candidate);

    const candidates = [
      candidateRepo.create({
        name: 'Dra. María Elena',
        party: 'Frente Universitario (FU)',
        description: 'Postula al rectorado con una propuesta de modernización tecnológica e infraestructura.',
        session: mainSession,
        active: true,
      }),
      candidateRepo.create({
        name: 'Dr. Carlos Mendoza',
        party: 'Movimiento Estudiantil UNT (MEU)',
        description: 'Enfocado en la investigación académica, becas internacionales y bienestar estudiantil.',
        session: mainSession,
        active: true,
      }),
      candidateRepo.create({
        name: 'Dr. Luis Paredes',
        party: 'Alianza Universitaria (AU)',
        description: 'Promueve la descentralización de recursos y mejora de las facultades de ingeniería y salud.',
        session: mainSession,
        active: true,
      })
    ];

    await candidateRepo.save(candidates);

    console.log('¡Seeding completado con éxito!');
  } catch (error) {
    console.error('Error durante el seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();
