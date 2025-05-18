-- First, create a function to help us drop all policies for a table
CREATE OR REPLACE FUNCTION drop_all_policies(target_table text)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname, schemaname, tablename 
        FROM pg_catalog.pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = target_table
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', pol.policyname, pol.schemaname, pol.tablename;
    END LOOP;
END;
$$;

-- Temporarily disable RLS on all tables to avoid any policy conflicts
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies using our helper function
DO $$
BEGIN
    PERFORM drop_all_policies('clients');
    PERFORM drop_all_policies('customer_submissions');
    PERFORM drop_all_policies('service_packages');
    PERFORM drop_all_policies('leads');
END $$;

-- Drop our helper function as it's no longer needed
DROP FUNCTION IF EXISTS drop_all_policies(text);

-- Drop and recreate role check functions to ensure they're clean
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.is_editor();

-- Create role check functions with explicit schema references
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')::text = 'admin',
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role')::text = 'editor',
    false
  );
$$;

-- Re-enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create new policies with fully qualified names and explicit type casts

-- Clients table policies
CREATE POLICY "admin_full_access_clients"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "customers_view_own_client"
ON public.clients
FOR SELECT
TO authenticated
USING ("public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid);

CREATE POLICY "customers_update_own_client"
ON public.clients
FOR UPDATE
TO authenticated
USING ("public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid)
WITH CHECK ("public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid);

-- Customer submissions policies
CREATE POLICY "admin_full_access_submissions"
ON public.customer_submissions
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "editor_access_submissions"
ON public.customer_submissions
FOR ALL
TO authenticated
USING (
  ("public"."customer_submissions"."assigned_editor_id"::uuid = (auth.uid())::uuid) OR
  public.is_editor()
);

CREATE POLICY "customers_view_own_submissions"
ON public.customer_submissions
FOR SELECT
TO authenticated
USING (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id"
    FROM "public"."clients"
    WHERE "public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid
  )
);

CREATE POLICY "customers_create_submissions"
ON public.customer_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id"
    FROM "public"."clients"
    WHERE "public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid
  )
);

CREATE POLICY "customers_update_submissions"
ON public.customer_submissions
FOR UPDATE
TO authenticated
USING (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id"
    FROM "public"."clients"
    WHERE "public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid
  )
)
WITH CHECK (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id"
    FROM "public"."clients"
    WHERE "public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid
  )
);

-- Leads table policies
CREATE POLICY "admin_full_access_leads"
ON public.leads
FOR ALL
TO authenticated
USING (public.is_admin());

CREATE POLICY "public_create_leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Service packages policies
CREATE POLICY "public_view_active_packages"
ON public.service_packages
FOR SELECT
TO anon, authenticated
USING ("public"."service_packages"."is_active" = true);

CREATE POLICY "admin_manage_packages"
ON public.service_packages
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Add helpful comments
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current user has admin role in app_metadata';
COMMENT ON FUNCTION public.is_editor() IS 'Checks if the current user has editor role in app_metadata';

-- Verify policies were created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND policyname = 'customers_view_own_client'
  ) THEN
    RAISE EXCEPTION 'Critical policy "customers_view_own_client" was not created successfully';
  END IF;
END $$; 