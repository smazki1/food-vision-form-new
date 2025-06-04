-- Add missing columns to customer_submissions table
-- Run this directly in Supabase SQL Editor

BEGIN;

-- Add missing columns that are causing 400 errors
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS original_item_id UUID,
ADD COLUMN IF NOT EXISTS assigned_package_id_at_submission UUID,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS internal_team_notes TEXT,
ADD COLUMN IF NOT EXISTS target_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS created_lead_id UUID REFERENCES public.leads(lead_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES public.leads(lead_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS submission_contact_name TEXT,
ADD COLUMN IF NOT EXISTS submission_contact_email TEXT,
ADD COLUMN IF NOT EXISTS submission_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS lora_link TEXT,
ADD COLUMN IF NOT EXISTS lora_name TEXT,
ADD COLUMN IF NOT EXISTS fixed_prompt TEXT,
ADD COLUMN IF NOT EXISTS lora_id TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_submissions_original_item_id 
ON public.customer_submissions(original_item_id);

CREATE INDEX IF NOT EXISTS idx_customer_submissions_created_lead_id 
ON public.customer_submissions(created_lead_id);

CREATE INDEX IF NOT EXISTS idx_customer_submissions_lead_id 
ON public.customer_submissions(lead_id);

-- Add comments for documentation
COMMENT ON COLUMN public.customer_submissions.original_item_id IS 'Reference to the original item (dish, cocktail, or drink) this submission is based on';
COMMENT ON COLUMN public.customer_submissions.assigned_package_id_at_submission IS 'Package ID that was assigned when this submission was created';
COMMENT ON COLUMN public.customer_submissions.edit_count IS 'Number of edits made to this submission';
COMMENT ON COLUMN public.customer_submissions.internal_team_notes IS 'Internal notes for team members, not visible to client';
COMMENT ON COLUMN public.customer_submissions.target_completion_date IS 'Target date for completion of this submission';
COMMENT ON COLUMN public.customer_submissions.priority IS 'Priority level: Low, Medium, High, Urgent';
COMMENT ON COLUMN public.customer_submissions.created_lead_id IS 'Reference to the lead that was created from this submission (if applicable)';
COMMENT ON COLUMN public.customer_submissions.lead_id IS 'Reference to the lead associated with this submission';
COMMENT ON COLUMN public.customer_submissions.submission_contact_name IS 'Contact name provided with the submission (for public submissions)';
COMMENT ON COLUMN public.customer_submissions.submission_contact_email IS 'Contact email provided with the submission (for public submissions)';
COMMENT ON COLUMN public.customer_submissions.submission_contact_phone IS 'Contact phone provided with the submission (for public submissions)';
COMMENT ON COLUMN public.customer_submissions.lora_link IS 'URL link to the LoRA model used for this submission';
COMMENT ON COLUMN public.customer_submissions.lora_name IS 'Descriptive name of the LoRA model';
COMMENT ON COLUMN public.customer_submissions.fixed_prompt IS 'Custom AI prompt used specifically for this submission';
COMMENT ON COLUMN public.customer_submissions.lora_id IS 'Free text identifier for the LoRA model (user defined)';

COMMIT; 