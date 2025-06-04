-- Add LoRA columns to customer_submissions table including lora_id field
-- This migration ensures all LoRA fields exist and work properly
-- No data deletion - only safe additions

BEGIN;

-- Ensure LoRA columns exist in customer_submissions table
-- Using IF NOT EXISTS to avoid errors if already present
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS lora_link TEXT,
ADD COLUMN IF NOT EXISTS lora_name TEXT,
ADD COLUMN IF NOT EXISTS fixed_prompt TEXT,
ADD COLUMN IF NOT EXISTS lora_id TEXT; -- New free text field for LoRA ID

-- Add comments for the new lora_id field
COMMENT ON COLUMN public.customer_submissions.lora_id IS 'Free text identifier for the LoRA model (user defined)';

-- Ensure submission_comments table exists (from previous migration)
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

-- Add trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for submission_comments
DROP TRIGGER IF EXISTS set_submission_comments_updated_at ON public.submission_comments;
CREATE TRIGGER set_submission_comments_updated_at
BEFORE UPDATE ON public.submission_comments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_submission_comments_submission_id ON public.submission_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_comments_created_by ON public.submission_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_submission_comments_comment_type ON public.submission_comments(comment_type);

-- Enable RLS on submission_comments if not already enabled
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Check if admin policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submission_comments' 
        AND policyname = 'admin_full_access_submission_comments'
    ) THEN
        CREATE POLICY "admin_full_access_submission_comments"
        ON public.submission_comments
        FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
    END IF;
    
    -- Check if editor select policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submission_comments' 
        AND policyname = 'editor_access_submission_comments'
    ) THEN
        CREATE POLICY "editor_access_submission_comments"
        ON public.submission_comments
        FOR SELECT
        TO authenticated
        USING (
          public.is_editor() AND 
          (comment_type IN ('editor_note', 'admin_internal') OR visibility IN ('editor', 'all'))
        );
    END IF;
    
    -- Check if editor create policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submission_comments' 
        AND policyname = 'editor_create_submission_comments'
    ) THEN
        CREATE POLICY "editor_create_submission_comments"
        ON public.submission_comments
        FOR INSERT
        TO authenticated
        WITH CHECK (
          public.is_editor() AND 
          comment_type = 'editor_note'
        );
    END IF;
    
    -- Check if client view policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'submission_comments' 
        AND policyname = 'client_view_submission_comments'
    ) THEN
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
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.submission_comments TO authenticated;

COMMIT; 