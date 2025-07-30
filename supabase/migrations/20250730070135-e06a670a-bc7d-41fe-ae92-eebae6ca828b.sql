-- CRITICAL SECURITY FIXES - Phase 1: Enable RLS on tables with existing policies

-- Enable RLS on tables that have policies but RLS is disabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_time_sessions ENABLE ROW LEVEL SECURITY;

-- Phase 2: Enable RLS and create policies for critical unprotected tables

-- Enable RLS on user_roles table (critical for role-based access)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add policies for user_roles table
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Users can view their own role"
ON public.user_roles  
FOR SELECT
USING (user_id = auth.uid());

-- Enable RLS on backups table (contains sensitive data)
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Add policy for backups table
CREATE POLICY "Only admins can access backups"
ON public.backups
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Enable RLS on client_image_activity_log table
ALTER TABLE public.client_image_activity_log ENABLE ROW LEVEL SECURITY;

-- Add policies for client_image_activity_log table  
CREATE POLICY "Admins can view all client image activity"
ON public.client_image_activity_log
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own image activity"
ON public.client_image_activity_log
FOR SELECT
USING (
  client_id IN (
    SELECT c.client_id FROM public.clients c 
    WHERE c.user_auth_id = auth.uid()
  )
);

-- Phase 3: Remove temporary/insecure policies

-- Remove temporary test user access policy from clients table
DROP POLICY IF EXISTS "temp_test_user_access" ON public.clients;

-- Remove temporary editor access policy from customer_submissions table  
DROP POLICY IF EXISTS "temp_editor_access_all_submissions" ON public.customer_submissions;

-- Remove temporary admin access policy from service_packages table
DROP POLICY IF EXISTS "temp_admin_access_all_packages" ON public.service_packages;

-- Remove temporary admin work time sessions policy
DROP POLICY IF EXISTS "temp_admin_work_time_sessions_all" ON public.work_time_sessions;

-- Phase 4: Fix function security issues by adding search_path protection

-- Update get_my_role function with proper search path
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- First try to get role from JWT
  IF auth.jwt() ->> 'user_role' IS NOT NULL THEN
    RETURN auth.jwt() ->> 'user_role';
  END IF;
  
  -- Check user_roles table for authenticated user
  IF auth.uid() IS NOT NULL THEN
    RETURN (
      SELECT role 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
      LIMIT 1
    );
  END IF;
  
  -- Default to null
  RETURN NULL;
END;
$$;

-- Update is_admin function with proper search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- Update is_editor function with proper search path  
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'editor'
  );
$$;