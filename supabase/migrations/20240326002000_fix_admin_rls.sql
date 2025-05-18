-- Drop the existing admin policy that uses JWT role
DROP POLICY IF EXISTS "Admins can manage all service packages" ON "public"."service_packages";

-- Create new policy that checks app_metadata.role instead
CREATE POLICY "Admins can manage all service packages"
ON "public"."service_packages"
FOR ALL
USING ((auth.jwt()->'app_metadata'->>'role') = 'admin')
WITH CHECK ((auth.jwt()->'app_metadata'->>'role') = 'admin');

-- Add helpful comment
COMMENT ON POLICY "Admins can manage all service packages" ON "public"."service_packages" 
IS 'Allows admin users (identified by app_metadata.role) to manage all service packages'; 