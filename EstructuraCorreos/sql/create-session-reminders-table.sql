-- Crear tabla para registrar recordatorios enviados
CREATE TABLE IF NOT EXISTS session_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  enrollment_id UUID NOT NULL,
  parent_email VARCHAR(255) NOT NULL,
  reminder_type VARCHAR(10) NOT NULL CHECK (reminder_type IN ('30d', '7d', '1d')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_session_reminders_session 
    FOREIGN KEY (session_id) REFERENCES session(sessionid) ON DELETE CASCADE,
  CONSTRAINT fk_session_reminders_enrollment 
    FOREIGN KEY (enrollment_id) REFERENCES enrollment(enrollmentid) ON DELETE CASCADE,
    
  -- Evitar duplicados
  UNIQUE(session_id, enrollment_id, reminder_type)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_session_reminders_session_id ON session_reminders(session_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_enrollment_id ON session_reminders(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_session_reminders_type ON session_reminders(reminder_type);
CREATE INDEX IF NOT EXISTS idx_session_reminders_sent_at ON session_reminders(sent_at);

-- Habilitar RLS (Row Level Security)
ALTER TABLE session_reminders ENABLE ROW LEVEL SECURITY;

-- Política para permitir operaciones del service role
CREATE POLICY "Allow service role full access" ON session_reminders
  FOR ALL USING (auth.role() = 'service_role');

