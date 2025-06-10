-- Fix submission_comments foreign key to reference public.users instead of auth.users
-- This ensures proper joining for user email information

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE public.submission_comments 
DROP CONSTRAINT IF EXISTS submission_comments_created_by_fkey;

-- Add new foreign key constraint referencing public.users
ALTER TABLE public.submission_comments 
ADD CONSTRAINT submission_comments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.users(user_auth_id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_submission_comments_created_by_users 
ON public.submission_comments(created_by);

-- Update comment to reflect the change
COMMENT ON COLUMN public.submission_comments.created_by IS 'References public.users.user_auth_id (not auth.users.id directly)';

COMMIT; 