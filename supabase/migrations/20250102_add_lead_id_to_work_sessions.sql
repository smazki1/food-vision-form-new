-- Migration: Add lead_id support to work_sessions table
-- This allows work sessions to be associated with leads as well as clients

BEGIN;

-- Add lead_id column to work_sessions table
ALTER TABLE work_sessions 
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(lead_id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_work_sessions_lead_id ON work_sessions(lead_id);

-- Update the constraint to allow either client_id OR lead_id (but not both)
ALTER TABLE work_sessions 
DROP CONSTRAINT IF EXISTS work_sessions_client_id_fkey;

-- Re-add the client_id foreign key constraint
ALTER TABLE work_sessions 
ADD CONSTRAINT work_sessions_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE;

-- Add check constraint to ensure either client_id or lead_id is set (but not both)
ALTER TABLE work_sessions 
ADD CONSTRAINT work_sessions_entity_check 
CHECK (
  (client_id IS NOT NULL AND lead_id IS NULL) OR 
  (client_id IS NULL AND lead_id IS NOT NULL)
);

-- Update RLS policies for work_sessions to include lead access
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON work_sessions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON work_sessions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON work_sessions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON work_sessions;

-- Create comprehensive RLS policies
CREATE POLICY "Enable read access for authenticated users" ON work_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON work_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON work_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON work_sessions
    FOR DELETE USING (auth.role() = 'authenticated');

-- Add comment explaining the enhanced table
COMMENT ON TABLE work_sessions IS 
'Work sessions tracking for both clients and leads. Each session must have either client_id OR lead_id set, but not both.';

COMMENT ON COLUMN work_sessions.lead_id IS 
'Foreign key to leads table. Mutually exclusive with client_id.';

COMMIT; 