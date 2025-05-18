-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can view their own submissions" ON "public"."customer_submissions";
DROP POLICY IF EXISTS "Customers can view service packages" ON "public"."service_packages";

-- Policy for customers to view their own submissions with fully qualified column names
CREATE POLICY "Customers can view their own submissions"
ON "public"."customer_submissions"
FOR SELECT
TO authenticated
USING (
  "public"."customer_submissions"."client_id" IN (
    SELECT "public"."clients"."client_id" 
    FROM "public"."clients" 
    WHERE "public"."clients"."user_auth_id" = auth.uid()
  )
);

-- Policy for customers to view service packages (simplified)
CREATE POLICY "Customers can view service packages"
ON "public"."service_packages"
FOR SELECT
TO authenticated
USING (true);

-- Add helpful comments
COMMENT ON POLICY "Customers can view their own submissions" ON "public"."customer_submissions" 
IS 'Allows authenticated customers to view submissions linked to their client_id using fully qualified column names';

COMMENT ON POLICY "Customers can view service packages" ON "public"."service_packages" 
IS 'Allows authenticated users to view all service packages'; 