-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow full access to clients" ON "public"."clients";

-- Enable RLS on clients table (in case it wasn't enabled)
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated customers to view their own record
CREATE POLICY "Authenticated customers can select their own client record"
ON "public"."clients"
FOR SELECT
TO authenticated
USING (auth.uid() = user_auth_id);

-- Policy for authenticated customers to update specific fields of their own record
CREATE POLICY "Authenticated customers can update their own client contact info"
ON "public"."clients"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_auth_id)
WITH CHECK (auth.uid() = user_auth_id);

-- Policy for service role (admin) to have full access
CREATE POLICY "Service role can manage all client records"
ON "public"."clients"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure the user_auth_id column exists and is properly typed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'user_auth_id'
    ) THEN
        ALTER TABLE "public"."clients" 
        ADD COLUMN "user_auth_id" UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create an index on user_auth_id for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_user_auth_id ON "public"."clients" (user_auth_id);

-- Comment on the policies for better documentation
COMMENT ON POLICY "Authenticated customers can select their own client record" ON "public"."clients" 
IS 'Allows authenticated customers to view only their own client record';

COMMENT ON POLICY "Authenticated customers can update their own client contact info" ON "public"."clients" 
IS 'Allows authenticated customers to update their own contact information';

COMMENT ON POLICY "Service role can manage all client records" ON "public"."clients" 
IS 'Allows service role (admin) full access to all client records'; 