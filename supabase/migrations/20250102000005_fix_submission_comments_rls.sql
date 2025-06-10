-- Fix submission comments RLS policies for proper access control
-- This migration ensures that internal comments work properly across all user types

BEGIN;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "admin_full_access_submission_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "editor_access_submission_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "editor_create_submission_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "client_view_submission_comments" ON public.submission_comments;

-- Admin has full access to all comments
CREATE POLICY "admin_full_access_submission_comments"
ON public.submission_comments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_auth_id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_auth_id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Editors can see and create editor and admin comments
CREATE POLICY "editor_read_submission_comments"
ON public.submission_comments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_auth_id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  ) AND (
    comment_type IN ('editor_note', 'admin_internal') OR 
    visibility IN ('editor', 'all')
  )
);

CREATE POLICY "editor_create_submission_comments"
ON public.submission_comments
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_auth_id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  ) AND (
    comment_type IN ('editor_note', 'admin_internal') OR 
    visibility IN ('editor', 'admin', 'all')
  )
);

-- Editors can update their own comments
CREATE POLICY "editor_update_own_submission_comments"
ON public.submission_comments
FOR UPDATE
TO authenticated
USING (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.user_auth_id = auth.uid() 
    AND users.role IN ('editor', 'admin')
  )
);

-- Clients can see client_visible comments for their submissions only
CREATE POLICY "client_view_submission_comments"
ON public.submission_comments
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

-- Enable comment tracking
COMMENT ON POLICY "admin_full_access_submission_comments" ON public.submission_comments IS 'Admin users have full access to all submission comments';
COMMENT ON POLICY "editor_read_submission_comments" ON public.submission_comments IS 'Editors can read editor and admin comments';
COMMENT ON POLICY "editor_create_submission_comments" ON public.submission_comments IS 'Editors can create editor and admin comments';
COMMENT ON POLICY "editor_update_own_submission_comments" ON public.submission_comments IS 'Editors can update their own comments';
COMMENT ON POLICY "client_view_submission_comments" ON public.submission_comments IS 'Clients can view client-visible comments on their submissions only';

COMMIT; 