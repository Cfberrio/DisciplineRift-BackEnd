-- Create session_exclusions table to track canceled practice dates
CREATE TABLE IF NOT EXISTS session_exclusions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sessionid UUID NOT NULL,
  excluded_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sessionid, excluded_date),
  FOREIGN KEY (sessionid) REFERENCES session(sessionid) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_exclusions_sessionid ON session_exclusions(sessionid);
CREATE INDEX IF NOT EXISTS idx_session_exclusions_date ON session_exclusions(excluded_date);

-- Enable RLS (Row Level Security)
ALTER TABLE session_exclusions ENABLE ROW LEVEL SECURITY;

-- Create policies for session_exclusions
CREATE POLICY "Allow authenticated users to read session exclusions" ON session_exclusions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert session exclusions" ON session_exclusions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete session exclusions" ON session_exclusions
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON session_exclusions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

