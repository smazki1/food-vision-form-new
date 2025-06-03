-- Drop the function if it already exists to ensure a clean recreation
DROP FUNCTION IF EXISTS public.get_my_role();

-- Create the get_my_role function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_catalog' 
AS $function$
DECLARE
  user_role_value TEXT;
BEGIN
  SELECT role
  INTO user_role_value
  FROM public.user_roles
  WHERE user_id = auth.uid();

  RETURN user_role_value;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
COMMENT ON FUNCTION public.get_my_role() IS 'Retrieves the role of the currently authenticated user from the user_roles table. Returns NULL if no role is found.';

-- Create leads enum types for better type safety
CREATE TYPE public.lead_status_enum AS ENUM (
  'new', 'contacted', 'interested_sent_pics', 'waiting_reply',
  'meeting_scheduled', 'demo_done', 'quote_sent', 'cold_follow_up',
  'not_interested', 'converted_to_client', 'archived'
);

CREATE TYPE public.lead_source_enum AS ENUM (
  'website', 'referral', 'facebook', 'instagram', 'auto_submission', 'other'
);

-- Create ai_pricing_settings table
CREATE TABLE IF NOT EXISTS public.ai_pricing_settings (
  setting_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  setting_value NUMERIC(10, 4) NOT NULL,
  description TEXT,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Populate with initial default values
INSERT INTO public.ai_pricing_settings (setting_name, setting_value, description) VALUES
  ('training_regular_cost', 1.50, 'Default cost for a regular AI training unit'),
  ('training_advanced_cost', 2.50, 'Default cost for an advanced AI training unit'),
  ('training_premium_cost', 5.00, 'Default cost for a premium AI training unit'),
  ('default_prompt_cost', 0.16, 'Default cost per AI prompt'),
  ('usd_to_local_currency_rate', 3.65, 'Conversion rate from USD to local currency (e.g., ILS)');

-- Drop old leads table (if exists) after migrating data
-- We'll first create the new table, then migrate data, then drop the old table
ALTER TABLE IF EXISTS public.leads RENAME TO leads_old;

-- Create new leads table with enhanced structure
CREATE TABLE IF NOT EXISTS public.leads (
  lead_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website_url TEXT,
  address TEXT,
  status TEXT DEFAULT 'new'::text NOT NULL,
  ai_trainings_count INTEGER DEFAULT 0 NOT NULL,
  ai_training_cost_per_unit NUMERIC(10, 2) DEFAULT 1.50,
  ai_prompts_count INTEGER DEFAULT 0 NOT NULL,
  ai_prompt_cost_per_unit NUMERIC(10, 2) DEFAULT 0.16,
  total_ai_costs NUMERIC(10, 2) GENERATED ALWAYS AS (
    (ai_trainings_count * ai_training_cost_per_unit) + 
    (ai_prompts_count * ai_prompt_cost_per_unit)
  ) STORED,
  revenue_from_lead_local NUMERIC(10, 2) DEFAULT 0.00,
  exchange_rate_at_conversion NUMERIC(10, 4),
  revenue_from_lead_usd NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE
      WHEN exchange_rate_at_conversion IS NOT NULL AND exchange_rate_at_conversion > 0
      THEN revenue_from_lead_local / exchange_rate_at_conversion
      ELSE 0
    END
  ) STORED,
  roi NUMERIC(10, 2) GENERATED ALWAYS AS (
    CASE
      WHEN ((ai_trainings_count * ai_training_cost_per_unit) + (ai_prompts_count * ai_prompt_cost_per_unit)) > 0
      THEN (
             (CASE -- Inlined revenue_from_lead_usd calculation
                WHEN exchange_rate_at_conversion IS NOT NULL AND exchange_rate_at_conversion > 0
                THEN revenue_from_lead_local / exchange_rate_at_conversion
                ELSE 0 
              END)
             - 
             ((ai_trainings_count * ai_training_cost_per_unit) + (ai_prompts_count * ai_prompt_cost_per_unit)) -- total_ai_costs calculation
           ) / 
           NULLIF(((ai_trainings_count * ai_training_cost_per_unit) + (ai_prompts_count * ai_prompt_cost_per_unit)), 0) -- total_ai_costs calculation (denominator), prevent division by zero
           * 100
      ELSE NULL
    END
  ) STORED,
  lead_source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  next_follow_up_date DATE,
  notes TEXT,
  client_id UUID REFERENCES public.clients(client_id) ON DELETE SET NULL,
  previous_status TEXT,
  lead_status TEXT DEFAULT 'ליד חדש',
  free_sample_package_active BOOLEAN DEFAULT false,
  business_type TEXT,
  reminder_details TEXT,
  reminder_at TIMESTAMPTZ,
  ai_training_5_count INTEGER DEFAULT 0,
  ai_training_15_count INTEGER DEFAULT 0,
  ai_training_25_count INTEGER DEFAULT 0
);

COMMENT ON COLUMN public.leads.total_ai_costs IS 'Calculated: (ai_trainings_count * ai_training_cost_per_unit) + (ai_prompts_count * ai_prompt_cost_per_unit)';
COMMENT ON COLUMN public.leads.roi IS 'Calculated: (revenue_from_lead_usd - total_ai_costs) / total_ai_costs * 100. Handle division by zero.';
COMMENT ON COLUMN public.leads.client_id IS 'If lead is converted, this links to the corresponding client record.';
COMMENT ON COLUMN public.leads.previous_status IS 'Used to store the previous status when archiving, to restore later if needed.';

-- Create lead_activity_log table
CREATE TABLE IF NOT EXISTS public.lead_activity_log (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  activity_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  activity_description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_lead_activity_log_lead_id ON public.lead_activity_log(lead_id);

-- Create lead_comments table
CREATE TABLE IF NOT EXISTS public.lead_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(lead_id) ON DELETE CASCADE,
  comment_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  comment_text TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_lead_comments_lead_id ON public.lead_comments(lead_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for leads table
CREATE TRIGGER set_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Migration function to move data from old leads table to new leads table (if old table exists)
CREATE OR REPLACE FUNCTION migrate_leads_data()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads_old') THEN
    INSERT INTO public.leads (
      lead_id,
      restaurant_name,
      contact_name,
      phone,
      email,
      status,
      lead_source,
      created_at,
      updated_at,
      notes,
      next_follow_up_date
    )
    SELECT
      lead_id::uuid,
      restaurant_name,
      contact_name,
      phone,
      email,
      CASE 
        WHEN status = 'ליד חדש' THEN 'new'
        WHEN status = 'פנייה ראשונית בוצעה' THEN 'contacted'
        WHEN status = 'מעוניין' THEN 'interested_sent_pics'
        WHEN status = 'לא מעוניין' THEN 'not_interested'
        WHEN status = 'נקבעה פגישה/שיחה' THEN 'meeting_scheduled'
        WHEN status = 'הדגמה בוצעה' THEN 'demo_done'
        WHEN status = 'הצעת מחיר נשלחה' THEN 'quote_sent'
        WHEN status = 'ממתין לתשובה' THEN 'waiting_reply'
        WHEN status = 'הפך ללקוח' THEN 'converted_to_client'
        ELSE 'new'
      END,
      NULL,
      created_at,
      created_at,
      NULL,
      NULL
    FROM public.leads_old;
    
    -- Log migration in activity log
    INSERT INTO public.lead_activity_log (lead_id, activity_description)
    SELECT 
      lead_id,
      'Lead migrated from old system.'
    FROM public.leads;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute migration function
SELECT migrate_leads_data();

-- Create function to log lead activity
CREATE OR REPLACE FUNCTION public.log_lead_activity(
  p_lead_id UUID,
  p_activity_description TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.lead_activity_log (lead_id, activity_description, user_id)
  VALUES (p_lead_id, p_activity_description, p_user_id);
END;
$$;

-- Function to convert lead to client
CREATE OR REPLACE FUNCTION public.convert_lead_to_client(p_lead_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_client_id UUID;
  v_lead_email TEXT;
  v_lead_restaurant_name TEXT;
  v_lead_contact_name TEXT;
  v_lead_phone TEXT;
  v_auth_id UUID;
BEGIN
  -- Ensure the caller is an admin or authorized user
  IF NOT get_my_role() = 'admin' THEN
    RAISE EXCEPTION 'User does not have permission to convert leads.';
  END IF;

  -- Get lead details
  SELECT email, restaurant_name, contact_name, phone
  INTO v_lead_email, v_lead_restaurant_name, v_lead_contact_name, v_lead_phone
  FROM public.leads
  WHERE lead_id = p_lead_id AND status != 'converted_to_client';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or already converted.';
  END IF;

  -- Create a user auth entry if one doesn't exist
  INSERT INTO auth.users (email, raw_user_meta_data)
  VALUES (v_lead_email, jsonb_build_object(
    'restaurant_name', v_lead_restaurant_name,
    'full_name', v_lead_contact_name,
    'phone', v_lead_phone
  ))
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_auth_id;
  
  -- If we couldn't create a new auth user, get the existing one
  IF v_auth_id IS NULL THEN
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE email = v_lead_email;
  END IF;

  -- Check if a client already exists with this email or restaurant name
  SELECT client_id INTO v_client_id
  FROM public.clients
  WHERE email = v_lead_email OR restaurant_name = v_lead_restaurant_name;

  IF v_client_id IS NULL THEN
    -- Create new client if not found
    INSERT INTO public.clients (
      restaurant_name, 
      contact_name, 
      email, 
      phone, 
      user_auth_id
    )
    VALUES (
      v_lead_restaurant_name, 
      v_lead_contact_name, 
      v_lead_email, 
      v_lead_phone, 
      v_auth_id
    )
    RETURNING client_id INTO v_client_id;
  END IF;

  -- Update lead status and link to client_id
  UPDATE public.leads
  SET status = 'converted_to_client',
      client_id = v_client_id,
      updated_at = NOW()
  WHERE lead_id = p_lead_id;

  -- Log this activity
  PERFORM public.log_lead_activity(p_lead_id, 'Lead converted to client. Client ID: ' || v_client_id::TEXT);

  RETURN v_client_id;
END;
$$;

-- Function to handle auto lead creation from submissions
CREATE OR REPLACE FUNCTION public.handle_new_submission_for_lead_creation(
  p_submission_restaurant_name TEXT,
  p_submission_contact_name TEXT,
  p_submission_email TEXT,
  p_submission_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_lead_id UUID;
  v_existing_client_id UUID;
  v_new_lead_id UUID;
BEGIN
  -- Normalize inputs for comparison
  p_submission_email := lower(p_submission_email);
  p_submission_restaurant_name := lower(p_submission_restaurant_name);

  -- Check existing leads
  SELECT lead_id INTO v_existing_lead_id
  FROM public.leads
  WHERE lower(email) = p_submission_email
    AND lower(restaurant_name) = p_submission_restaurant_name;

  IF v_existing_lead_id IS NOT NULL THEN
    RAISE NOTICE 'Lead already exists: %', v_existing_lead_id;
    RETURN NULL;
  END IF;

  -- Check existing clients
  SELECT client_id INTO v_existing_client_id
  FROM public.clients
  WHERE lower(email) = p_submission_email
    AND lower(restaurant_name) = p_submission_restaurant_name;

  IF v_existing_client_id IS NOT NULL THEN
    RAISE NOTICE 'Client already exists: %', v_existing_client_id;
    RETURN NULL;
  END IF;

  -- Create new lead
  INSERT INTO public.leads (
    restaurant_name, 
    contact_name, 
    email, 
    phone,
    status, 
    lead_source, 
    next_follow_up_date
  ) VALUES (
    p_submission_restaurant_name, 
    p_submission_contact_name, 
    p_submission_email, 
    p_submission_phone,
    'new', 
    'auto_submission', 
    NOW() + INTERVAL '24 hours'
  ) RETURNING lead_id INTO v_new_lead_id;

  -- Log activity for the new lead
  IF v_new_lead_id IS NOT NULL THEN
    PERFORM public.log_lead_activity(v_new_lead_id, 'Lead created from automatic submission.', auth.uid());
  END IF;

  RETURN v_new_lead_id;
END;
$$;

-- Row-Level Security Policies
-- Enable RLS on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Only admins can access leads
CREATE POLICY "Allow admin full access on leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Enable RLS on lead_activity_log table
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access lead_activity_log
CREATE POLICY "Allow admin full access on lead_activity_log"
  ON public.lead_activity_log
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Enable RLS on lead_comments table
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Only admins can access lead_comments
CREATE POLICY "Allow admin full access on lead_comments"
  ON public.lead_comments
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Enable RLS on ai_pricing_settings table
ALTER TABLE public.ai_pricing_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage settings
CREATE POLICY "Allow admin full access on ai_pricing_settings"
  ON public.ai_pricing_settings
  FOR ALL
  TO authenticated
  USING (get_my_role() = 'admin')
  WITH CHECK (get_my_role() = 'admin');

-- Authenticated users can read settings
CREATE POLICY "Allow authenticated users to read ai_pricing_settings"
  ON public.ai_pricing_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.log_lead_activity(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_submission_for_lead_creation(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add lead_id field to customer_submissions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_submissions' 
    AND column_name = 'lead_id'
  ) THEN
    ALTER TABLE public.customer_submissions 
    ADD COLUMN lead_id UUID REFERENCES public.leads(lead_id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_customer_submissions_lead_id 
    ON public.customer_submissions(lead_id);
  END IF;
END $$;

-- Enhanced function to automatically link submissions to leads
CREATE OR REPLACE FUNCTION public.link_submission_to_lead_auto()
RETURNS TRIGGER AS $$
DECLARE
  v_lead_id UUID;
  v_client_id UUID;
BEGIN
  -- Skip if lead_id is already set
  IF NEW.lead_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- First check if there's a matching client (existing client)
  SELECT client_id INTO v_client_id
  FROM public.clients
  WHERE lower(email) = lower(NEW.email)
     OR lower(restaurant_name) = lower(NEW.restaurant_name);

  -- If client exists, don't create lead (this is an existing client)
  IF v_client_id IS NOT NULL THEN
    NEW.client_id := v_client_id;
    RETURN NEW;
  END IF;

  -- Look for existing lead
  SELECT lead_id INTO v_lead_id
  FROM public.leads
  WHERE lower(email) = lower(NEW.email)
     OR lower(restaurant_name) = lower(NEW.restaurant_name);

  IF v_lead_id IS NULL THEN
    -- Create new lead
    INSERT INTO public.leads (
      restaurant_name,
      contact_name,
      email,
      phone,
      lead_status,
      lead_source,
      free_sample_package_active,
      notes
    ) VALUES (
      NEW.restaurant_name,
      NEW.contact_name,
      NEW.email,
      NEW.phone,
      'ליד חדש',
      'אתר',
      true, -- Auto-activate free sample package
      'ליד נוצר אוטומטית מהגשה פומבית'
    ) RETURNING lead_id INTO v_lead_id;

    -- Log the lead creation
    IF v_lead_id IS NOT NULL THEN
      PERFORM public.log_lead_activity(
        v_lead_id, 
        'ליד נוצר אוטומטית מהגשה פומבית - ' || NEW.item_name_at_submission || ' (' || NEW.item_type || ')'
      );
    END IF;
  ELSE
    -- Update existing lead to activate free sample package if not already active
    UPDATE public.leads 
    SET free_sample_package_active = true,
        updated_at = NOW()
    WHERE lead_id = v_lead_id 
      AND free_sample_package_active = false;

    -- Log submission to existing lead
    PERFORM public.log_lead_activity(
      v_lead_id, 
      'הגשה חדשה התקבלה - ' || NEW.item_name_at_submission || ' (' || NEW.item_type || ')'
    );
  END IF;

  -- Link submission to lead
  NEW.lead_id := v_lead_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic lead linking
DROP TRIGGER IF EXISTS trigger_link_submission_to_lead ON public.customer_submissions;
CREATE TRIGGER trigger_link_submission_to_lead
  BEFORE INSERT ON public.customer_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.link_submission_to_lead_auto();

-- Create new lead_status_type enum with Hebrew values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status_type') THEN
    CREATE TYPE lead_status_type AS ENUM (
      'ליד חדש',
      'פנייה ראשונית בוצעה', 
      'בטיפול',
      'מעוניין',
      'לא מעוניין',
      'הפך ללקוח',
      'ארכיון'
    );
  ELSE
    -- Add new status if it doesn't exist
    ALTER TYPE lead_status_type ADD VALUE IF NOT EXISTS 'בטיפול';
  END IF;
END $$;

-- Update the status column to use the proper field name if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_status') THEN
    ALTER TABLE public.leads RENAME COLUMN status TO lead_status;
  END IF;
END $$; 