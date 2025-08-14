-- Create image_comments table for per-image commenting system
-- This allows users to comment on specific images within a submission

BEGIN;

-- Create image_comments table
CREATE TABLE IF NOT EXISTS public.image_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.customer_submissions(submission_id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- The specific image this comment is about
  image_type TEXT NOT NULL CHECK (image_type IN ('original', 'processed')), -- Whether it's original or processed image
  comment_type TEXT NOT NULL CHECK (comment_type IN ('admin_internal', 'client_visible', 'editor_note')),
  comment_text TEXT NOT NULL,
  tagged_users UUID[],
  visibility TEXT NOT NULL DEFAULT 'admin' CHECK (visibility IN ('private', 'client', 'editor', 'admin', 'all')),
  created_by UUID REFERENCES public.users(user_auth_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_comments_submission_id ON public.image_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_image_comments_image_url ON public.image_comments(image_url);
CREATE INDEX IF NOT EXISTS idx_image_comments_created_by ON public.image_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_image_comments_comment_type ON public.image_comments(comment_type);
CREATE INDEX IF NOT EXISTS idx_image_comments_image_type ON public.image_comments(image_type);

-- Create trigger for updated_at on image_comments
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image_comments
DROP TRIGGER IF EXISTS set_image_comments_updated_at ON public.image_comments;
CREATE TRIGGER set_image_comments_updated_at
BEFORE UPDATE ON public.image_comments
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Enable RLS on image_comments
ALTER TABLE public.image_comments ENABLE ROW LEVEL SECURITY;

-- Admin has full access to all image comments
CREATE POLICY "admin_full_access_image_comments"
ON public.image_comments
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Editors can see and create editor and admin comments
CREATE POLICY "editor_read_image_comments"
ON public.image_comments
FOR SELECT
TO authenticated
USING (
  public.is_editor() AND 
  (comment_type IN ('editor_note', 'admin_internal') OR visibility IN ('editor', 'all'))
);

CREATE POLICY "editor_create_image_comments"
ON public.image_comments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_editor() AND 
  comment_type = 'editor_note'
);

-- Clients can see client_visible comments for their submissions only
CREATE POLICY "client_view_image_comments"
ON public.image_comments
FOR SELECT
TO authenticated
USING (
  comment_type = 'client_visible' AND
  visibility IN ('client', 'all') AND
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

-- Allow all authenticated users to insert comments (for now, can be restricted later)
CREATE POLICY "allow_authenticated_insert_image_comments"
ON public.image_comments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "allow_authenticated_update_own_image_comments"
ON public.image_comments
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Add comments to explain the new table
COMMENT ON TABLE public.image_comments IS 'Comments system for individual images within submissions';
COMMENT ON COLUMN public.image_comments.image_url IS 'The specific image URL this comment refers to';
COMMENT ON COLUMN public.image_comments.image_type IS 'Whether this comment is about an original or processed image';
COMMENT ON COLUMN public.image_comments.comment_type IS 'Type of comment: admin_internal (admin only), client_visible (client can see), editor_note (editor specific)';

COMMIT;
