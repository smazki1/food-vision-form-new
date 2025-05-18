-- First, disable RLS temporarily to avoid any policy conflicts during updates
ALTER TABLE "public"."clients" DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to ensure a clean slate
DROP POLICY IF EXISTS "Authenticated customers can select their own client record" ON "public"."clients";
DROP POLICY IF EXISTS "Authenticated customers can update their own client contact info" ON "public"."clients";
DROP POLICY IF EXISTS "Service role can manage all client records" ON "public"."clients";
DROP POLICY IF EXISTS "Clients can view their own data" ON "public"."clients";
DROP POLICY IF EXISTS "Admins can view all client data" ON "public"."clients";

-- Re-enable RLS
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role' = 'admin',
    false
  );
$$;

-- Create base policies with explicit column references and no ambiguity

-- 1. SELECT Policy for Customers (Most Critical)
CREATE POLICY "customers_select_own_data"
ON "public"."clients"
FOR SELECT
TO authenticated
USING (
  "public"."clients"."user_auth_id" = auth.uid()
);

-- 2. UPDATE Policy for Customers
CREATE POLICY "customers_update_own_data"
ON "public"."clients"
FOR UPDATE
TO authenticated
USING (
  "public"."clients"."user_auth_id" = auth.uid()
)
WITH CHECK (
  "public"."clients"."user_auth_id" = auth.uid()
);

-- 3. Admin Full Access Policy
CREATE POLICY "admin_full_access"
ON "public"."clients"
FOR ALL
TO authenticated
USING (
  public.is_admin()
)
WITH CHECK (
  public.is_admin()
);

-- 4. Service Role Full Access Policy
CREATE POLICY "service_role_full_access"
ON "public"."clients"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comments for documentation
COMMENT ON POLICY "customers_select_own_data" ON "public"."clients" 
IS 'Allows customers to view only their own data using explicit user_auth_id = auth.uid() check';

COMMENT ON POLICY "customers_update_own_data" ON "public"."clients" 
IS 'Allows customers to update only their own data using explicit user_auth_id = auth.uid() check';

COMMENT ON POLICY "admin_full_access" ON "public"."clients" 
IS 'Allows admin users full access to all client records';

COMMENT ON POLICY "service_role_full_access" ON "public"."clients" 
IS 'Allows service role full access to all client records';

-- Verify user_auth_id column exists and is correctly typed
DO $$ 
BEGIN
  -- Check if the column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clients' 
    AND column_name = 'user_auth_id'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE "public"."clients" 
    ADD COLUMN "user_auth_id" UUID REFERENCES auth.users(id);
  END IF;

  -- Ensure the column is properly indexed
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE tablename = 'clients'
    AND indexname = 'idx_clients_user_auth_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_clients_user_auth_id 
    ON "public"."clients" ("user_auth_id");
  END IF;
END $$; 