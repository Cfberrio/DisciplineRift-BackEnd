-- Script para crear un padre de prueba con tu número verificado
-- IMPORTANTE: Reemplaza los valores con datos reales

-- 1. Crear padre de prueba
INSERT INTO parent (parentid, firstname, lastname, email, phone)
VALUES (
    gen_random_uuid(),  -- Genera un UUID único
    'Test',             -- Nombre de prueba
    'Parent',           -- Apellido de prueba  
    'test@example.com', -- Email de prueba
    '+1234567890'       -- TU NÚMERO VERIFICADO EN TWILIO
);

-- 2. Crear estudiante de prueba (opcional)
INSERT INTO student (studentid, firstname, lastname, parentid, grade, dob)
VALUES (
    gen_random_uuid(),
    'Test',
    'Student', 
    (SELECT parentid FROM parent WHERE email = 'test@example.com'),
    '9th',
    '2010-01-01'
);

-- 3. Inscribir en un equipo existente (opcional)
-- Reemplaza 'TEAM_ID_AQUI' con un ID real de tu BD
INSERT INTO enrollment (enrollmentid, studentid, teamid, isactive, enrollmentdate)
VALUES (
    gen_random_uuid(),
    (SELECT studentid FROM student WHERE firstname = 'Test' AND lastname = 'Student'),
    'TEAM_ID_AQUI',  -- Reemplaza con ID real
    true,
    CURRENT_DATE
);

-- Para eliminar el padre de prueba después:
-- DELETE FROM enrollment WHERE studentid IN (SELECT studentid FROM student WHERE parentid IN (SELECT parentid FROM parent WHERE email = 'test@example.com'));
-- DELETE FROM student WHERE parentid IN (SELECT parentid FROM parent WHERE email = 'test@example.com');
-- DELETE FROM parent WHERE email = 'test@example.com';
