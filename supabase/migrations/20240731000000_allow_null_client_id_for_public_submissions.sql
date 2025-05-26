-- Create dishes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.dishes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid, -- Initially allowing NULL, will be made NOT NULL by original logic if needed, or kept NULL for public
    name text NOT NULL,
    description text,
    notes text, -- Corresponds to p_notes in RPC
    reference_image_urls text[], -- Corresponds to p_reference_image_urls
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create cocktails table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.cocktails (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid,
    name text NOT NULL,
    description text,
    notes text,
    reference_image_urls text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create drinks table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.drinks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid,
    name text NOT NULL,
    description text,
    notes text,
    reference_image_urls text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow NULL for client_id in customer_submissions
ALTER TABLE public.customer_submissions
ALTER COLUMN client_id DROP NOT NULL;

-- Allow NULL for client_id in dishes
-- This command assumes the table 'dishes' and column 'client_id' exist.
-- If 'client_id' is already nullable, this command will likely succeed with a notice or do nothing.
-- If the table or column does not exist, it will error.
ALTER TABLE public.dishes
ALTER COLUMN client_id DROP NOT NULL;

-- Allow NULL for client_id in cocktails
-- Similar assumptions as for the 'dishes' table.
ALTER TABLE public.cocktails
ALTER COLUMN client_id DROP NOT NULL;

-- Allow NULL for client_id in drinks
-- Similar assumptions as for the 'dishes' table.
ALTER TABLE public.drinks
ALTER COLUMN client_id DROP NOT NULL;

-- Note: If these tables (dishes, cocktails, drinks) were supposed to have client_id as NOT NULL
-- and linked to public.clients, those constraints should be in their original CREATE TABLE statements.
-- For the purpose of this migration (allowing public uploads where client_id might be NULL initially),
-- ensuring client_id can be NULL is the primary goal.
-- The RPC function handles associating with a client if a restaurant_name is matched. 