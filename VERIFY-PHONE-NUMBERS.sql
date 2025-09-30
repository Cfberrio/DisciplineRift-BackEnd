-- Consulta para ver todos los números de teléfono de padres
-- Útil para saber qué números verificar en Twilio Trial

SELECT DISTINCT 
    p.phone as numero_padre,
    p.firstname || ' ' || p.lastname as nombre_padre,
    p.email,
    COUNT(DISTINCT s.studentid) as cantidad_estudiantes
FROM parent p
INNER JOIN student s ON p.parentid = s.parentid
INNER JOIN enrollment e ON s.studentid = e.studentid
WHERE p.phone IS NOT NULL 
    AND p.phone != ''
    AND e.isactive = true
GROUP BY p.parentid, p.phone, p.firstname, p.lastname, p.email
ORDER BY cantidad_estudiantes DESC, nombre_padre;

-- Para ver números de un equipo específico:
-- Reemplaza 'TEAM_ID_AQUI' con el ID del equipo que quieres probar

SELECT DISTINCT 
    p.phone as numero_padre,
    p.firstname || ' ' || p.lastname as nombre_padre,
    t.name as equipo,
    s.firstname || ' ' || s.lastname as estudiante
FROM parent p
INNER JOIN student s ON p.parentid = s.parentid
INNER JOIN enrollment e ON s.studentid = e.studentid
INNER JOIN team t ON e.teamid = t.teamid
WHERE p.phone IS NOT NULL 
    AND p.phone != ''
    AND e.isactive = true
    AND t.teamid = 'TEAM_ID_AQUI'  -- Reemplaza con el ID real
ORDER BY nombre_padre;
