-- Drop all existing policies that might have ambiguous column references
DROP POLICY IF EXISTS "Admins have full access to clients" ON public.clients;
DROP POLICY IF EXISTS "Customers can view and update their own client record" ON public.clients;
DROP POLICY IF EXISTS "Customers can update their own contact details" ON public.clients;
DROP POLICY IF EXISTS "Admins have full access to submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "Editors can access assigned submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "Customers can view their own submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "Customers can create new submissions" ON public.customer_submissions;
DROP POLICY IF EXISTS "Customers can update submission feedback and approval" ON public.customer_submissions;
DROP POLICY IF EXISTS "Admins have full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can create a lead" ON public.leads;
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.service_packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.service_packages;

-- Create or replace the admin role check function with explicit schema references
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'admin',
    false
  );
$$;

-- Create or replace the editor role check function
CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role') = 'editor',
    false
  );
$$;

-- Recreate all policies with fully qualified column names and explicit schema references

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
USING ("public"."clients"."user_auth_id" = auth.uid());

CREATE POLICY "customers_update_own_client"
ON public.clients
FOR UPDATE
TO authenticated
USING ("public"."clients"."user_auth_id" = auth.uid())
WITH CHECK ("public"."clients"."user_auth_id" = auth.uid());

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
  "public"."customer_submissions"."assigned_editor_id" = auth.uid() OR
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
    WHERE "public"."clients"."user_auth_id" = auth.uid()
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
    WHERE "public"."clients"."user_auth_id" = auth.uid()
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
    WHERE "public"."clients"."user_auth_id" = auth.uid()
  )
)
WITH CHECK (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id"
    FROM "public"."clients"
    WHERE "public"."clients"."user_auth_id" = auth.uid()
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