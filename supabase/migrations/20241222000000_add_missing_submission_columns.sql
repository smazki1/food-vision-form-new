-- Add missing columns to customer_submissions table
-- These columns exist in backup but may be missing from migration history

BEGIN;

-- Add missing columns that appear in the backup but not in migrations
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS original_item_id UUID,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS internal_team_notes TEXT,
ADD COLUMN IF NOT EXISTS target_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS submission_contact_name TEXT,
ADD COLUMN IF NOT EXISTS submission_contact_email TEXT,
ADD COLUMN IF NOT EXISTS submission_contact_phone TEXT;

-- Add missing status timestamp columns if they exist in backup
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS "status_ממתינה_לעיבוד_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "status_בעיבוד_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "status_מוכנה_להצגה_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "status_הערות_התקבלו_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "status_הושלמה_ואושרה_at" TIMESTAMPTZ;

-- Create index for performance on original_item_id if the column was just created
CREATE INDEX IF NOT EXISTS idx_customer_submissions_original_item_id 
ON public.customer_submissions(original_item_id);

-- Add comments for the new columns
COMMENT ON COLUMN public.customer_submissions.original_item_id IS 'Reference to the original item (dish, cocktail, or drink) this submission is based on';
COMMENT ON COLUMN public.customer_submissions.edit_count IS 'Number of edits made to this submission';
COMMENT ON COLUMN public.customer_submissions.internal_team_notes IS 'Internal notes for team members, not visible to client';
COMMENT ON COLUMN public.customer_submissions.target_completion_date IS 'Target date for completion of this submission';
COMMENT ON COLUMN public.customer_submissions.priority IS 'Priority level: Low, Medium, High, Urgent';
COMMENT ON COLUMN public.customer_submissions.submission_contact_name IS 'Contact name provided with the submission (for public submissions)';
COMMENT ON COLUMN public.customer_submissions.submission_contact_email IS 'Contact email provided with the submission (for public submissions)';
COMMENT ON COLUMN public.customer_submissions.submission_contact_phone IS 'Contact phone provided with the submission (for public submissions)';

COMMIT; 