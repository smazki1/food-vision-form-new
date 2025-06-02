-- Enhanced Submission Management System
-- Add new fields to customer_submissions table for comprehensive submission management

BEGIN;

-- Add new fields to customer_submissions table
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS lora_link TEXT,
ADD COLUMN IF NOT EXISTS lora_name TEXT,
ADD COLUMN IF NOT EXISTS fixed_prompt TEXT,
ADD COLUMN IF NOT EXISTS created_lead_id UUID REFERENCES public.leads(lead_id) ON DELETE SET NULL;

-- Create submission_comments table for advanced comment system
CREATE TABLE IF NOT EXISTS public.submission_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.customer_submissions(submission_id) ON DELETE CASCADE,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('admin_internal', 'client_visible', 'editor_note')),
  comment_text TEXT NOT NULL,
  tagged_users UUID[],
  visibility TEXT NOT NULL DEFAULT 'admin' CHECK (visibility IN ('private', 'client', 'editor', 'admin', 'all')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_comments_submission_id ON public.submission_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_comments_created_by ON public.submission_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_submission_comments_comment_type ON public.submission_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_created_lead_id ON public.customer_submissions(created_lead_id);

-- Create trigger for updated_at on submission_comments
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for submission_comments
CREATE TRIGGER IF NOT EXISTS set_submission_comments_updated_at
BEFORE UPDATE ON public.submission_comments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Add comments to explain the new fields
COMMENT ON COLUMN public.customer_submissions.lora_link IS 'URL link to the LoRA model used for this submission';
COMMENT ON COLUMN public.customer_submissions.lora_name IS 'Descriptive name of the LoRA model';
COMMENT ON COLUMN public.customer_submissions.fixed_prompt IS 'Custom AI prompt used specifically for this submission';
COMMENT ON COLUMN public.customer_submissions.created_lead_id IS 'Reference to the lead that was created from this submission (if applicable)';

COMMENT ON TABLE public.submission_comments IS 'Comments system for submissions with different visibility levels';
COMMENT ON COLUMN public.submission_comments.comment_type IS 'Type of comment: admin_internal (admin only), client_visible (client can see), editor_note (editor specific)';
COMMENT ON COLUMN public.submission_comments.tagged_users IS 'Array of user IDs that are tagged in this comment';
COMMENT ON COLUMN public.submission_comments.visibility IS 'Who can see this comment: private, client, editor, admin, all';

-- RLS Policies for submission_comments
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

-- Admin can see all comments
CREATE POLICY "admin_full_access_submission_comments"
ON public.submission_comments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Editors can see editor and admin comments, and create editor comments
CREATE POLICY "editor_access_submission_comments"
ON public.submission_comments
FOR SELECT
TO authenticated
USING (
  public.is_editor() AND 
  (comment_type IN ('editor_note', 'admin_internal') OR visibility IN ('editor', 'all'))
);

CREATE POLICY "editor_create_submission_comments"
ON public.submission_comments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor() AND 
  comment_type = 'editor_note'
);

-- Clients can see client_visible comments for their submissions
CREATE POLICY "client_view_submission_comments"
ON public.submission_comments
FOR SELECT
TO authenticated
USING (
  comment_type = 'client_visible' AND
  submission_id IN (
    SELECT submission_id 
    FROM public.customer_submissions 
    WHERE client_id IN (
      SELECT client_id 
      FROM public.clients 
      WHERE user_auth_id = auth.uid()
    )
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_comments TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMIT; 