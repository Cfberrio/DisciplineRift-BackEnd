-- Add cancel column to session table
ALTER TABLE session ADD COLUMN IF NOT EXISTS cancel TEXT DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN session.cancel IS 'Comma-separated list of dates (YYYY-MM-DD) when this session is canceled';

-- Create index for faster filtering when querying canceled sessions
CREATE INDEX IF NOT EXISTS idx_session_cancel ON session(cancel) WHERE cancel IS NOT NULL;
























