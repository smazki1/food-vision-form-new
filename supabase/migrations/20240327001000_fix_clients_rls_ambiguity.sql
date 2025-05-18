-- Drop existing policies to recreate them with fully qualified column names
DROP POLICY IF EXISTS "Authenticated customers can select their own client record" ON "public"."clients";
DROP POLICY IF EXISTS "Authenticated customers can update their own client contact info" ON "public"."clients";
DROP POLICY IF EXISTS "Service role can manage all client records" ON "public"."clients";

-- Ensure RLS is enabled
ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;

-- Recreate SELECT policy with fully qualified column names
CREATE POLICY "Authenticated customers can select their own client record"
ON "public"."clients"
FOR SELECT
TO authenticated
USING ("public"."clients"."user_auth_id" = auth.uid());

-- Recreate UPDATE policy with fully qualified column names
CREATE POLICY "Authenticated customers can update their own client contact info"
ON "public"."clients"
FOR UPDATE
TO authenticated
USING ("public"."clients"."user_auth_id" = auth.uid())
WITH CHECK ("public"."clients"."user_auth_id" = auth.uid());

-- Recreate service role policy
CREATE POLICY "Service role can manage all client records"
ON "public"."clients"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add helpful comments
COMMENT ON POLICY "Authenticated customers can select their own client record" ON "public"."clients" 
IS 'Allows authenticated customers to view only their own client record using fully qualified column names';

COMMENT ON POLICY "Authenticated customers can update their own client contact info" ON "public"."clients" 
IS 'Allows authenticated customers to update their own contact information using fully qualified column names';

COMMENT ON POLICY "Service role can manage all client records" ON "public"."clients" 
IS 'Allows service role (admin) full access to all client records'; 