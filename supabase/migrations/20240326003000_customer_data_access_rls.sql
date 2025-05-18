-- Enable RLS on tables (if not already enabled)
ALTER TABLE "public"."customer_submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_packages" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can view their own submissions" ON "public"."customer_submissions";
DROP POLICY IF EXISTS "Customers can view service packages" ON "public"."service_packages";

-- Policy for customers to view their own submissions
CREATE POLICY "Customers can view their own submissions"
ON "public"."customer_submissions"
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.clients 
    WHERE user_auth_id = auth.uid()
  )
);

-- Policy for customers to view service packages
CREATE POLICY "Customers can view service packages"
ON "public"."service_packages"
FOR SELECT
TO authenticated
USING (true);  -- Allow viewing all packages, active or not

-- Add helpful comments
COMMENT ON POLICY "Customers can view their own submissions" ON "public"."customer_submissions" 
IS 'Allows authenticated customers to view submissions linked to their client_id';

COMMENT ON POLICY "Customers can view service packages" ON "public"."service_packages" 
IS 'Allows authenticated users to view all service packages'; 