-- Enable RLS on service_packages table
ALTER TABLE "public"."service_packages" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read access to active service packages" ON "public"."service_packages";
DROP POLICY IF EXISTS "Service role can manage all service packages" ON "public"."service_packages";
DROP POLICY IF EXISTS "Admins can manage all service packages" ON "public"."service_packages";

-- Create policy for public read access to active packages
CREATE POLICY "Allow public read access to active service packages"
ON "public"."service_packages"
FOR SELECT
USING (is_active = true);

-- Create policy for service role (admin backend operations)
CREATE POLICY "Service role can manage all service packages"
ON "public"."service_packages"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy for admin users (frontend admin panel)
CREATE POLICY "Admins can manage all service packages"
ON "public"."service_packages"
FOR ALL
USING (auth.jwt() ->> 'role' = 'admin')
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Ensure the is_active column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'service_packages' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE "public"."service_packages" 
        ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON POLICY "Allow public read access to active service packages" ON "public"."service_packages" 
IS 'Allows anyone to view active service packages';

COMMENT ON POLICY "Service role can manage all service packages" ON "public"."service_packages" 
IS 'Allows service role full access to manage all service packages';

COMMENT ON POLICY "Admins can manage all service packages" ON "public"."service_packages" 
IS 'Allows admin users to manage all service packages'; 