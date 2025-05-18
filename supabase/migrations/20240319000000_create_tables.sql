-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
    client_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_auth_id uuid NOT NULL,
    restaurant_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text,
    current_package_id uuid,
    remaining_servings integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email_notifications boolean DEFAULT true,
    app_notifications boolean DEFAULT true
);

-- Create service_packages table
CREATE TABLE IF NOT EXISTS public.service_packages (
    package_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    total_servings integer NOT NULL,
    price decimal(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customer_submissions table
CREATE TABLE IF NOT EXISTS public.customer_submissions (
    submission_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES public.clients(client_id),
    item_type text NOT NULL,
    item_name_at_submission text NOT NULL,
    submission_status text NOT NULL DEFAULT 'ממתינה לעיבוד',
    uploaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at timestamp with time zone,
    final_approval_timestamp timestamp with time zone,
    assigned_editor_id uuid,
    original_image_urls text[],
    processed_image_urls text[],
    main_processed_image_url text,
    edit_history jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT valid_item_type CHECK (item_type IN ('dish', 'cocktail', 'drink'))
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
    lead_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    restaurant_name text NOT NULL,
    contact_name text NOT NULL,
    email text NOT NULL,
    phone text,
    message text,
    status text DEFAULT 'new',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add foreign key from clients to service_packages
ALTER TABLE public.clients
ADD CONSTRAINT fk_current_package
FOREIGN KEY (current_package_id)
REFERENCES public.service_packages(package_id); 