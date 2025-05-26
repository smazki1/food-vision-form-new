-- Drop our helper function if it exists from previous migrations
DROP FUNCTION IF EXISTS drop_all_policies(text);

-- Create a function to help us drop all policies for a table
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

-- Helper functions for role checks
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

-- Enable RLS on all tables (disabled on problematic ones)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.additional_details ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.visual_styles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
BEGIN
    PERFORM drop_all_policies('clients');
    PERFORM drop_all_policies('customer_submissions');
    PERFORM drop_all_policies('service_packages');
    PERFORM drop_all_policies('leads');
--    PERFORM drop_all_policies('dishes');
--    PERFORM drop_all_policies('cocktails');
--    PERFORM drop_all_policies('drinks');
--    PERFORM drop_all_policies('additional_details');
--    PERFORM drop_all_policies('visual_styles');
--    PERFORM drop_all_policies('messages');
--    PERFORM drop_all_policies('notifications');
--    PERFORM drop_all_policies('user_roles');
END $$;

-- Drop our helper function as it's no longer needed
DROP FUNCTION IF EXISTS drop_all_policies(text);

-- Create policies

-- 1. Clients
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

-- 2. Customer submissions
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

-- 3. Service packages
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

-- 4. Leads
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

-- 9. Visual styles (disabled)
-- CREATE POLICY "public_view_visual_styles"
-- ON public.visual_styles
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- CREATE POLICY "admin_manage_visual_styles"
-- ON public.visual_styles
-- FOR ALL
-- TO authenticated
-- USING (public.is_admin())
-- WITH CHECK (public.is_admin());

-- 10. Messages (disabled)
-- CREATE POLICY "admin_full_access_messages"
-- ON public.messages
-- FOR ALL
-- TO authenticated
-- USING (public.is_admin());

-- CREATE POLICY "users_view_own_messages"
-- ON public.messages
-- FOR SELECT
-- TO authenticated
-- USING (
--   "public"."messages"."sender_id"::uuid = (auth.uid())::uuid OR
--   "public"."messages"."submission_id" IN (
--     SELECT "public"."customer_submissions"."submission_id"
--     FROM "public"."customer_submissions"
--     WHERE 
--       ("public"."customer_submissions"."assigned_editor_id"::uuid = (auth.uid())::uuid) OR
--       ("public"."customer_submissions"."client_id" IN (
--         SELECT "public"."clients"."client_id"
--         FROM "public"."clients"
--         WHERE "public"."clients"."user_auth_id"::uuid = (auth.uid())::uuid
--       ))
--   )
-- );

-- CREATE POLICY "users_create_own_messages"
-- ON public.messages
-- FOR INSERT
-- TO authenticated
-- WITH CHECK ("public"."messages"."sender_id"::uuid = (auth.uid())::uuid);

-- 11. Notifications (disabled)
-- CREATE POLICY "admin_full_access_notifications"
-- ON public.notifications
-- FOR ALL
-- TO authenticated
-- USING (public.is_admin());

-- CREATE POLICY "users_manage_own_notifications"
-- ON public.notifications
-- FOR ALL
-- TO authenticated
-- USING ("public"."notifications"."user_id"::uuid = (auth.uid())::uuid)
-- WITH CHECK ("public"."notifications"."user_id"::uuid = (auth.uid())::uuid);

-- 12. User roles (disabled)
-- CREATE POLICY "admin_full_access_user_roles"
-- ON public.user_roles
-- FOR ALL
-- TO authenticated
-- USING (public.is_admin());

-- CREATE POLICY "users_view_own_roles"
-- ON public.user_roles
-- FOR SELECT
-- TO authenticated
-- USING ("public"."user_roles"."user_id"::uuid = (auth.uid())::uuid);

-- Comments
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current user has admin role in app_metadata';
COMMENT ON FUNCTION public.is_editor() IS 'Checks if the current user has editor role in app_metadata';

-- Verify critical policies
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

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'customer_submissions' 
    AND policyname = 'customers_view_own_submissions'
  ) THEN
    RAISE EXCEPTION 'Critical policy "customers_view_own_submissions" was not created successfully';
  END IF;
END $$;
