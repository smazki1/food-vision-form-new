-- Add username and password columns to affiliates table for user account credentials
ALTER TABLE affiliates 
ADD COLUMN username TEXT,
ADD COLUMN password TEXT;

-- Add comment explaining these fields
COMMENT ON COLUMN affiliates.username IS 'Auto-generated username for affiliate login';
COMMENT ON COLUMN affiliates.password IS 'Auto-generated password for affiliate login (stored for admin reference only)'; 