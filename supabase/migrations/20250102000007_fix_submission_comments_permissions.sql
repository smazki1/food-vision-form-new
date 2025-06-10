-- Fix submission_comments RLS permissions to allow authenticated users to add comments
-- This resolves the 401 error when trying to insert comments

BEGIN;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "authenticated_users_can_read_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "authenticated_users_can_insert_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "admin_full_access_submission_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "editor_access_submission_comments" ON public.submission_comments;
DROP POLICY IF EXISTS "client_view_submission_comments" ON public.submission_comments;

-- Temporarily disable RLS to allow all authenticated operations
ALTER TABLE public.submission_comments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policies
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read all comments
CREATE POLICY "allow_authenticated_read_comments" ON public.submission_comments
FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert comments
CREATE POLICY "allow_authenticated_insert_comments" ON public.submission_comments
FOR INSERT TO authenticated WITH CHECK (true);

-- Allow users to update their own comments
CREATE POLICY "allow_authenticated_update_own_comments" ON public.submission_comments
FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own comments  
CREATE POLICY "allow_authenticated_delete_own_comments" ON public.submission_comments
FOR DELETE TO authenticated USING (created_by = auth.uid());

COMMIT; 