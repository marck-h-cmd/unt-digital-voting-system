TRUNCATE TABLE votes, candidates, sessions CASCADE;

INSERT INTO sessions (name, description, "startTime", "endTime", active, finalized, "totalVotes", "validVotes", "noiseVotes", "createdAt", "updatedAt") 
VALUES ('Elecciones Universitarias UNT 2026', 'Elección para la asamblea universitaria y centros de estudiantes mediante sistema criptográfico.', EXTRACT(EPOCH FROM NOW()), EXTRACT(EPOCH FROM NOW() + INTERVAL '30 days'), true, false, 0, 0, 0, NOW(), NOW());

INSERT INTO candidates (id, name, party, description, "voteCount", active, "sessionId", "createdAt", "updatedAt") VALUES 
(gen_random_uuid(), 'Dra. María Elena', 'Frente Universitario (FU)', 'Postula al rectorado con una propuesta de modernización tecnológica e infraestructura.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'Dr. Carlos Mendoza', 'Movimiento Estudiantil UNT (MEU)', 'Enfocado en la investigación académica, becas internacionales y bienestar estudiantil.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'Dr. Luis Paredes', 'Alianza Universitaria (AU)', 'Promueve la descentralización de recursos y mejora de las facultades de ingeniería y salud.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW());
