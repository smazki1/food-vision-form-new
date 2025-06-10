-- Migration: Add work time tracking for clients and leads
-- This creates tables to track work time sessions and total work time

-- Add work time columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS total_work_time_minutes INTEGER DEFAULT 0;

-- Add work time columns to leads table  
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS total_work_time_minutes INTEGER DEFAULT 0;

-- Create work time sessions table for detailed tracking
CREATE TABLE IF NOT EXISTS work_time_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type VARCHAR(10) NOT NULL CHECK (entity_type IN ('client', 'lead')),
  entity_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_time_sessions_entity ON work_time_sessions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_work_time_sessions_active ON work_time_sessions(is_active) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for work_time_sessions
DROP TRIGGER IF EXISTS update_work_time_sessions_updated_at ON work_time_sessions;
CREATE TRIGGER update_work_time_sessions_updated_at
    BEFORE UPDATE ON work_time_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on work_time_sessions
ALTER TABLE work_time_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for work_time_sessions
CREATE POLICY "Enable read access for authenticated users" ON work_time_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON work_time_sessions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON work_time_sessions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON work_time_sessions
    FOR DELETE USING (auth.role() = 'authenticated'); 