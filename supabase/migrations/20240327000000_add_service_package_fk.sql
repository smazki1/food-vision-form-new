-- Add foreign key constraint between clients and service_packages
DO $$ 
BEGIN
    -- First ensure the current_package_id column exists and is of the correct type
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'current_package_id'
    ) THEN
        ALTER TABLE "public"."clients" 
        ADD COLUMN "current_package_id" UUID;
    END IF;

    -- Drop the constraint if it exists (to handle potential renames/changes)
    ALTER TABLE "public"."clients" 
    DROP CONSTRAINT IF EXISTS "fk_current_package";
    
    ALTER TABLE "public"."clients" 
    DROP CONSTRAINT IF EXISTS "clients_current_package_id_fkey";

    -- Add the foreign key constraint with Supabase's standard naming convention
    ALTER TABLE "public"."clients"
    ADD CONSTRAINT "clients_current_package_id_fkey"
    FOREIGN KEY (current_package_id)
    REFERENCES "public"."service_packages" (package_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

    -- Add an index to improve join performance
    CREATE INDEX IF NOT EXISTS "idx_clients_current_package_id" 
    ON "public"."clients" (current_package_id);
END $$; 