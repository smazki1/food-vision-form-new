-- First, disable RLS temporarily to avoid any policy conflicts
ALTER TABLE "public"."clients" DISABLE ROW LEVEL SECURITY;

-- Drop existing policies on clients table
SELECT drop_all_policies('clients');

-- Create a security definer function to check client ownership
-- This function will run with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.check_client_ownership(client_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients
    WHERE client_id = $1
    AND user_auth_id = auth.uid()
  );
$$;

-- Create a security definer function to get a user's client_id
-- This function will run with elevated privileges to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT client_id
  FROM public.clients
  WHERE user_auth_id = auth.uid()
  LIMIT 1;
$$;

-- Re-enable RLS
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- Create simplified policies for clients table that don't cause recursion
CREATE POLICY "admin_full_access_clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_admin());

-- Simple direct policy for customers to view their own client record
CREATE POLICY "customers_view_own_client"
ON public.clients
FOR SELECT
TO authenticated
USING (user_auth_id::uuid = auth.uid()::uuid);

-- Simple direct policy for customers to update their own client record
CREATE POLICY "customers_update_own_client"
ON public.clients
FOR UPDATE
TO authenticated
USING (user_auth_id::uuid = auth.uid()::uuid)
WITH CHECK (user_auth_id::uuid = auth.uid()::uuid);

-- Update customer_submissions policies to use the security definer functions
DROP POLICY IF EXISTS "customers_view_own_submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "customers_create_submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "customers_update_submissions" ON public.customer_submissions;

CREATE POLICY "customers_view_own_submissions"
ON public.customer_submissions
FOR SELECT
TO authenticated
USING (client_id = public.get_user_client_id());

CREATE POLICY "customers_create_submissions"
ON public.customer_submissions
FOR INSERT
TO authenticated
WITH CHECK (client_id = public.get_user_client_id());

CREATE POLICY "customers_update_submissions"
ON public.customer_submissions
FOR UPDATE
TO authenticated
USING (client_id = public.get_user_client_id())
WITH CHECK (client_id = public.get_user_client_id());

-- Add helpful comments
COMMENT ON FUNCTION public.check_client_ownership(uuid) IS 'Security definer function to check if a client_id belongs to the current user';
COMMENT ON FUNCTION public.get_user_client_id() IS 'Security definer function to get the current user''s client_id';

-- Verify the policies were created correctly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND polname = 'customers_view_own_client'
  ) THEN
    RAISE EXCEPTION 'Critical policy "customers_view_own_client" was not created successfully';
  END IF;
END $$; 