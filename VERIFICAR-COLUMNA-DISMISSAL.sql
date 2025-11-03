-- Script para verificar la columna StudentDismisall en la base de datos
-- Ejecuta estos queries en el SQL Editor de Supabase

-- 1. Ver todas las columnas de la tabla student que contengan "dismiss"
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'student' 
  AND column_name LIKE '%dismiss%';

-- 2. Verificar con diferentes variaciones del nombre (case-insensitive)
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'student' 
  AND LOWER(column_name) LIKE '%dismiss%';

-- 3. Ver TODAS las columnas de la tabla student (para identificar el nombre exacto)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'student' 
ORDER BY ordinal_position;

-- 4. Ver datos de ejemplo usando la columna exacta (ajusta el nombre según el resultado de la query anterior)
-- Intenta con diferentes variaciones:

-- Opción A: todo minúsculas
SELECT 
    studentid,
    firstname,
    lastname,
    studentdismisall
FROM student 
WHERE studentdismisall IS NOT NULL 
  AND studentdismisall != ''
LIMIT 10;

-- Opción B: con mayúsculas mixtas (requiere comillas)
SELECT 
    studentid,
    firstname,
    lastname,
    "StudentDismisall"
FROM student 
WHERE "StudentDismisall" IS NOT NULL 
  AND "StudentDismisall" != ''
LIMIT 10;

-- 5. Estadísticas de la columna
-- (Ajusta el nombre de la columna según lo que funcione arriba)
SELECT 
    COUNT(*) as total_estudiantes,
    COUNT(studentdismisall) as con_dismissal_data,
    COUNT(*) - COUNT(studentdismisall) as sin_dismissal_data,
    ROUND(100.0 * COUNT(studentdismisall) / COUNT(*), 2) as porcentaje_lleno
FROM student;

-- 6. Ver valores únicos en la columna dismissal
SELECT 
    studentdismisall as dismissal_value,
    COUNT(*) as cantidad_estudiantes
FROM student 
GROUP BY studentdismisall
ORDER BY cantidad_estudiantes DESC;

-- 7. Ver ejemplos de estudiantes CON datos de dismissal
SELECT 
    studentid,
    firstname,
    lastname,
    studentdismisall,
    LENGTH(studentdismisall) as longitud_texto
FROM student 
WHERE studentdismisall IS NOT NULL
LIMIT 20;

-- 8. Ver ejemplos de estudiantes SIN datos de dismissal
SELECT 
    studentid,
    firstname,
    lastname,
    studentdismisall
FROM student 
WHERE studentdismisall IS NULL OR studentdismisall = ''
LIMIT 10;

