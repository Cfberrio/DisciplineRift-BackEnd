-- Tabla para rastrear intentos de envío de recordatorios
CREATE TABLE IF NOT EXISTS reminder_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  email_type VARCHAR(50) NOT NULL DEFAULT 'season_reminder',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  scheduled_time TIMESTAMPTZ NOT NULL,
  executed_time TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, failed, retrying
  error_message TEXT,
  email_sent_id TEXT, -- ID del email enviado (messageId de nodemailer)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Índices para consultas eficientes
  UNIQUE(session_id, parent_id, email_type),
  INDEX idx_reminder_attempts_status ON reminder_attempts(status),
  INDEX idx_reminder_attempts_scheduled ON reminder_attempts(scheduled_time),
  INDEX idx_reminder_attempts_session ON reminder_attempts(session_id),
  INDEX idx_reminder_attempts_parent ON reminder_attempts(parent_id)
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reminder_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER reminder_attempts_updated_at
  BEFORE UPDATE ON reminder_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_reminder_attempts_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE reminder_attempts IS 'Rastrea intentos de envío de recordatorios por email';
COMMENT ON COLUMN reminder_attempts.session_id IS 'ID de la sesión para la cual se envía el recordatorio';
COMMENT ON COLUMN reminder_attempts.parent_id IS 'ID del padre que recibe el recordatorio';
COMMENT ON COLUMN reminder_attempts.email_type IS 'Tipo de recordatorio (season_reminder, session_reminder, etc.)';
COMMENT ON COLUMN reminder_attempts.attempt_number IS 'Número de intento (1, 2, 3...)';
COMMENT ON COLUMN reminder_attempts.scheduled_time IS 'Hora programada para envío';
COMMENT ON COLUMN reminder_attempts.executed_time IS 'Hora real de envío exitoso';
COMMENT ON COLUMN reminder_attempts.status IS 'Estado: pending, sent, failed, retrying';
COMMENT ON COLUMN reminder_attempts.error_message IS 'Mensaje de error si falló el envío';
COMMENT ON COLUMN reminder_attempts.email_sent_id IS 'ID del mensaje enviado por nodemailer';
