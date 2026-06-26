TRUNCATE TABLE votes, candidates, sessions, siu_students CASCADE;

INSERT INTO sessions (name, description, "startTime", "endTime", active, finalized, "totalVotes", "validVotes", "noiseVotes", "createdAt", "updatedAt") 
VALUES ('Elecciones Universitarias UNT 2026', 'Elección para la asamblea universitaria y centros de estudiantes mediante sistema criptográfico.', EXTRACT(EPOCH FROM TIMESTAMP '2026-06-25 00:00:00'), EXTRACT(EPOCH FROM TIMESTAMP '2026-06-30 23:59:59'), true, false, 0, 0, 0, NOW(), NOW());

INSERT INTO candidates (id, name, party, description, "voteCount", active, "sessionId", "createdAt", "updatedAt") VALUES 
(gen_random_uuid(), 'Dra. María Elena', 'Frente Universitario (FU)', 'Postula al rectorado con una propuesta de modernización tecnológica e infraestructura.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'Dr. Carlos Mendoza', 'Movimiento Estudiantil UNT (MEU)', 'Enfocado en la investigación académica, becas internacionales y bienestar estudiantil.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW()),
(gen_random_uuid(), 'Dr. Luis Paredes', 'Alianza Universitaria (AU)', 'Promueve la descentralización de recursos y mejora de las facultades de ingeniería y salud.', 0, true, (SELECT id FROM sessions LIMIT 1), NOW(), NOW());

INSERT INTO siu_students (dni, carnet, "fullName", email, status, "facialReferenceUrl") VALUES
('12345678', '2020123456', 'Juan Perez', 'juanperez@unitru.edu.pe', 'ENROLLED', ''),
('87654321', '2021654321', 'Maria Rodriguez', 'mariarodriguez@unitru.edu.pe', 'ENROLLED', ''),
('11223344', '2022112233', 'Carlos Gomez', 'carlosgomez@unitru.edu.pe', 'ENROLLED', '');
