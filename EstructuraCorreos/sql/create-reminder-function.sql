-- Crear función para obtener sesiones que necesitan recordatorios
CREATE OR REPLACE FUNCTION get_sessions_for_reminders()
RETURNS TABLE (
  sessionid UUID,
  teamid UUID,
  startdate DATE,
  starttime TIME,
  endtime TIME,
  daysofweek TEXT,
  team_name TEXT,
  school_name TEXT,
  school_location TEXT,
  enrollmentid UUID,
  student_name TEXT,
  parent_email TEXT,
  parent_name TEXT,
  reminder_type TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH reminder_dates AS (
    SELECT 
      s.sessionid,
      s.teamid,
      s.startdate,
      s.starttime,
      s.endtime,
      s.daysofweek,
      t.name as team_name,
      sc.name as school_name,
      sc.location as school_location,
      e.enrollmentid,
      st.firstname || ' ' || st.lastname as student_name,
      p.email as parent_email,
      p.firstname || ' ' || p.lastname as parent_name,
      CASE 
        WHEN s.startdate = CURRENT_DATE + INTERVAL '30 days' THEN '30d'
        WHEN s.startdate = CURRENT_DATE + INTERVAL '7 days' THEN '7d'
        WHEN s.startdate = CURRENT_DATE + INTERVAL '1 day' THEN '1d'
      END as reminder_type
    FROM session s
    JOIN team t ON s.teamid = t.teamid
    JOIN school sc ON t.schoolid = sc.schoolid
    JOIN enrollment e ON t.teamid = e.teamid
    JOIN student st ON e.studentid = st.studentid
    JOIN parent p ON e.parentid = p.parentid
    WHERE s.startdate IN (
      CURRENT_DATE + INTERVAL '30 days',
      CURRENT_DATE + INTERVAL '7 days',
      CURRENT_DATE + INTERVAL '1 day'
    )
  )
  SELECT rd.*
  FROM reminder_dates rd
  LEFT JOIN session_reminders sr ON (
    rd.sessionid = sr.session_id 
    AND rd.enrollmentid = sr.enrollment_id 
    AND rd.reminder_type = sr.reminder_type
  )
  WHERE sr.id IS NULL
  ORDER BY rd.reminder_type DESC, rd.starttime;
END;
$$;

-- Dar permisos a la función
GRANT EXECUTE ON FUNCTION get_sessions_for_reminders() TO anon;
GRANT EXECUTE ON FUNCTION get_sessions_for_reminders() TO authenticated;

