-- Migration: Add roster fields to student table
-- Date: 2025-10-30
-- Description: Adds StudentDismissal, teacher, and medcondition columns to student table

-- Add StudentDismissal column (student dismissal information)
ALTER TABLE student 
ADD COLUMN IF NOT EXISTS StudentDismissal VARCHAR(255);

-- Add teacher column (student's teacher name)
ALTER TABLE student 
ADD COLUMN IF NOT EXISTS teacher VARCHAR(255);

-- Add medcondition column (medical conditions)
ALTER TABLE student 
ADD COLUMN IF NOT EXISTS medcondition TEXT;

-- Add comments for documentation
COMMENT ON COLUMN student.StudentDismissal IS 'Student dismissal information or instructions';
COMMENT ON COLUMN student.teacher IS 'Student''s teacher name';
COMMENT ON COLUMN student.medcondition IS 'Student medical conditions or notes';

