-- Add missing fields to clients table to support complete lead-to-client conversion
-- This ensures all lead data can be synchronized to the client profile

BEGIN;

-- Add address field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'address'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN address TEXT;
        COMMENT ON COLUMN public.clients.address IS 'Physical address of the restaurant/business';
    END IF;
END $$;

-- Add website_url field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'website_url'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN website_url TEXT;
        COMMENT ON COLUMN public.clients.website_url IS 'Website URL of the restaurant/business';
    END IF;
END $$;

-- Add business_type field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'business_type'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN business_type TEXT;
        COMMENT ON COLUMN public.clients.business_type IS 'Type of business (restaurant, cafe, etc.)';
    END IF;
END $$;

-- Add updated_at field if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        COMMENT ON COLUMN public.clients.updated_at IS 'Timestamp of last update to client record';
    END IF;
END $$;

-- Add payment-related fields for client management
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN payment_status TEXT DEFAULT 'לא מוגדר';
        COMMENT ON COLUMN public.clients.payment_status IS 'Payment status for client billing';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'payment_due_date'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN payment_due_date DATE;
        COMMENT ON COLUMN public.clients.payment_due_date IS 'Due date for client payment';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'payment_amount_ils'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN payment_amount_ils NUMERIC(10, 2);
        COMMENT ON COLUMN public.clients.payment_amount_ils IS 'Payment amount in Israeli Shekels';
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_address ON public.clients (address);
CREATE INDEX IF NOT EXISTS idx_clients_website_url ON public.clients (website_url);
CREATE INDEX IF NOT EXISTS idx_clients_business_type ON public.clients (business_type);
CREATE INDEX IF NOT EXISTS idx_clients_payment_status ON public.clients (payment_status);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at ON public.clients (updated_at);

-- Update existing clients to have updated_at if NULL
UPDATE public.clients 
SET updated_at = created_at 
WHERE updated_at IS NULL;

COMMIT; 