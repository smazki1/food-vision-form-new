-- Add comprehensive cost tracking fields to clients table to match leads cost structure
-- This enables full cost synchronization from leads to clients during conversion

BEGIN;

-- Add AI training count fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_trainings_count'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_trainings_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.clients.ai_trainings_count IS 'Number of AI trainings used for this client (legacy field)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_training_5_count'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_training_5_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.clients.ai_training_5_count IS 'Number of $5 AI trainings used for this client';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_training_15_count'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_training_15_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.clients.ai_training_15_count IS 'Number of $1.5 AI trainings used for this client';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_training_25_count'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_training_25_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.clients.ai_training_25_count IS 'Number of $2.5 AI trainings used for this client';
    END IF;
END $$;

-- Add AI prompts count field
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_prompts_count'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_prompts_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN public.clients.ai_prompts_count IS 'Number of AI prompts used for this client';
    END IF;
END $$;

-- Add cost per unit fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_training_cost_per_unit'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_training_cost_per_unit NUMERIC(10, 2) DEFAULT 1.50;
        COMMENT ON COLUMN public.clients.ai_training_cost_per_unit IS 'Cost per AI training unit for this client';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'ai_prompt_cost_per_unit'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN ai_prompt_cost_per_unit NUMERIC(10, 2) DEFAULT 0.162;
        COMMENT ON COLUMN public.clients.ai_prompt_cost_per_unit IS 'Cost per AI prompt for this client';
    END IF;
END $$;

-- Add revenue tracking fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'revenue_from_client_local'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN revenue_from_client_local NUMERIC(10, 2) DEFAULT 0.00;
        COMMENT ON COLUMN public.clients.revenue_from_client_local IS 'Revenue from this client in local currency (ILS)';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'exchange_rate_at_conversion'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN exchange_rate_at_conversion NUMERIC(10, 4);
        COMMENT ON COLUMN public.clients.exchange_rate_at_conversion IS 'USD to ILS exchange rate when client was converted from lead';
    END IF;
END $$;

-- Add calculated fields for revenue in USD
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'revenue_from_client_usd'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN revenue_from_client_usd NUMERIC(10, 2) 
        GENERATED ALWAYS AS (
            CASE
                WHEN exchange_rate_at_conversion IS NOT NULL AND exchange_rate_at_conversion > 0
                THEN revenue_from_client_local / exchange_rate_at_conversion
                ELSE NULL
            END
        ) STORED;
        COMMENT ON COLUMN public.clients.revenue_from_client_usd IS 'Revenue converted to USD for consistent ROI calculation';
    END IF;
END $$;

-- Add calculated field for total AI costs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'total_ai_costs'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN total_ai_costs NUMERIC(10, 2) 
        GENERATED ALWAYS AS (
            (
                ((ai_training_25_count * 2.5) + 
                 (ai_training_15_count * 1.5) + 
                 (ai_training_5_count * 5.0) + 
                 (ai_prompts_count * ai_prompt_cost_per_unit))
            )
        ) STORED;
        COMMENT ON COLUMN public.clients.total_ai_costs IS 'Calculated total AI costs: (training counts * rates) + (prompts * rate)';
    END IF;
END $$;

-- Add calculated field for ROI
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'roi'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN roi NUMERIC(10, 2) 
        GENERATED ALWAYS AS (
            CASE
                WHEN (
                    ((ai_training_25_count * 2.5) + 
                     (ai_training_15_count * 1.5) + 
                     (ai_training_5_count * 5.0) + 
                     (ai_prompts_count * ai_prompt_cost_per_unit)) > 0
                ) AND (
                    CASE
                        WHEN exchange_rate_at_conversion IS NOT NULL AND exchange_rate_at_conversion > 0
                        THEN revenue_from_client_local / exchange_rate_at_conversion
                        ELSE NULL
                    END IS NOT NULL
                )
                THEN (
                    (
                        CASE
                            WHEN exchange_rate_at_conversion IS NOT NULL AND exchange_rate_at_conversion > 0
                            THEN revenue_from_client_local / exchange_rate_at_conversion
                            ELSE NULL
                        END - 
                        ((ai_training_25_count * 2.5) + 
                         (ai_training_15_count * 1.5) + 
                         (ai_training_5_count * 5.0) + 
                         (ai_prompts_count * ai_prompt_cost_per_unit))
                    ) / NULLIF(
                        ((ai_training_25_count * 2.5) + 
                         (ai_training_15_count * 1.5) + 
                         (ai_training_5_count * 5.0) + 
                         (ai_prompts_count * ai_prompt_cost_per_unit)), 0
                    ) * 100
                )
                ELSE NULL
            END
        ) STORED;
        COMMENT ON COLUMN public.clients.roi IS 'Calculated ROI: (revenue_usd - total_ai_costs) / total_ai_costs * 100';
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_total_ai_costs ON public.clients (total_ai_costs);
CREATE INDEX IF NOT EXISTS idx_clients_roi ON public.clients (roi);
CREATE INDEX IF NOT EXISTS idx_clients_revenue_local ON public.clients (revenue_from_client_local);

-- Update the convert_lead_to_client function to transfer cost data
DROP FUNCTION IF EXISTS public.convert_lead_to_client(uuid);

CREATE OR REPLACE FUNCTION public.convert_lead_to_client(p_lead_id uuid) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_record leads%ROWTYPE;
  new_client_id uuid;
  existing_client_id uuid;
  lead_notes text;
  activity_log_entries text := '';
  comments_json jsonb;
  lead_comments jsonb := '[]'::jsonb;
  internal_notes_data jsonb;
BEGIN
  -- Get the lead record
  SELECT * INTO lead_record FROM leads WHERE lead_id = p_lead_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found with ID: %', p_lead_id;
  END IF;
  
  -- Check if lead is already converted
  IF lead_record.lead_status = 'הפך ללקוח' AND lead_record.client_id IS NOT NULL THEN
    RAISE NOTICE 'Lead % is already converted to client %', p_lead_id, lead_record.client_id;
    RETURN lead_record.client_id;
  END IF;
  
  -- Check if a client already exists with the same email or restaurant name
  SELECT client_id INTO existing_client_id
  FROM clients 
  WHERE lower(email) = lower(lead_record.email) 
     OR lower(restaurant_name) = lower(lead_record.restaurant_name)
  LIMIT 1;
  
  IF existing_client_id IS NOT NULL THEN
    -- Link lead to existing client and merge comments + cost data
    
    -- Get existing client comments
    SELECT COALESCE(internal_notes, '')::text INTO lead_notes
    FROM clients WHERE client_id = existing_client_id;
    
    -- Try to parse existing client data
    BEGIN
      internal_notes_data := lead_notes::jsonb;
      IF internal_notes_data ? 'clientComments' THEN
        comments_json := internal_notes_data->'clientComments';
      ELSE
        comments_json := '[]'::jsonb;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Not JSON, treat as originalNotes
        comments_json := '[]'::jsonb;
        internal_notes_data := jsonb_build_object('originalNotes', lead_notes);
    END;
    
    -- Convert lead comments to client format and merge
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', activity_id::text,
        'text', REPLACE(activity_description, 'תגובה: ', ''),
        'timestamp', activity_timestamp,
        'source', 'lead'
      )
    ) INTO lead_comments
    FROM lead_activity_log 
    WHERE lead_id = p_lead_id 
      AND activity_description LIKE 'תגובה:%';
    
    -- Merge lead comments with existing client comments
    IF lead_comments IS NOT NULL THEN
      comments_json := comments_json || lead_comments;
    END IF;
    
    -- Update client with merged data including cost information
    internal_notes_data := jsonb_build_object(
      'clientComments', comments_json,
      'originalNotes', COALESCE(internal_notes_data->>'originalNotes', ''),
      'leadNotes', COALESCE(lead_record.notes, ''),
      'mergedFromLead', p_lead_id::text
    );
    
    UPDATE clients 
    SET 
      internal_notes = internal_notes_data::text,
      last_activity_at = now(),
      -- Transfer all cost data from lead
      ai_trainings_count = COALESCE(lead_record.ai_trainings_count, 0),
      ai_training_5_count = COALESCE(lead_record.ai_training_5_count, 0),
      ai_training_15_count = COALESCE(lead_record.ai_training_15_count, 0),
      ai_training_25_count = COALESCE(lead_record.ai_training_25_count, 0),
      ai_prompts_count = COALESCE(lead_record.ai_prompts_count, 0),
      ai_training_cost_per_unit = COALESCE(lead_record.ai_training_cost_per_unit, 1.50),
      ai_prompt_cost_per_unit = COALESCE(lead_record.ai_prompt_cost_per_unit, 0.162),
      revenue_from_client_local = COALESCE(lead_record.revenue_from_lead_local, 0.00),
      exchange_rate_at_conversion = lead_record.exchange_rate_at_conversion
    WHERE client_id = existing_client_id;
    
    -- Update lead
    UPDATE leads 
    SET 
      lead_status = 'הפך ללקוח',
      client_id = existing_client_id,
      updated_at = now()
    WHERE lead_id = p_lead_id;
    
    -- Log the activity
    INSERT INTO lead_activity_log (lead_id, activity_description)
    VALUES (p_lead_id, 'הליד קושר ללקוח קיים עם העברת נתוני עלויות: ' || existing_client_id::text);
    
    RETURN existing_client_id;
  END IF;
  
  -- Prepare comments from lead activities in proper JSON format
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', activity_id::text,
      'text', REPLACE(activity_description, 'תגובה: ', ''),
      'timestamp', activity_timestamp,
      'source', 'lead'
    )
  ) INTO lead_comments
  FROM lead_activity_log 
  WHERE lead_id = p_lead_id 
    AND activity_description LIKE 'תגובה:%';
  
  -- If no comments, use empty array
  IF lead_comments IS NULL THEN
    lead_comments := '[]'::jsonb;
  END IF;
  
  -- Prepare notes from other lead activities for reference
  SELECT string_agg(
    'פעילות (' || to_char(activity_timestamp, 'DD/MM/YYYY HH24:MI') || '): ' || activity_description, 
    E'\n'
  ) INTO activity_log_entries
  FROM lead_activity_log 
  WHERE lead_id = p_lead_id 
    AND NOT activity_description LIKE 'תגובה:%';
  
  -- Create internal_notes JSON structure
  internal_notes_data := jsonb_build_object(
    'clientComments', lead_comments,
    'originalNotes', COALESCE(lead_record.notes, ''),
    'leadActivities', COALESCE(activity_log_entries, ''),
    'convertedFromLead', p_lead_id::text
  );
  
  -- Create new client record with comprehensive field mapping including all cost data
  INSERT INTO clients (
    restaurant_name,
    contact_name,
    phone,
    email,
    original_lead_id,
    client_status,
    internal_notes,
    notes,
    address,
    website_url,
    business_type,
    created_at,
    last_activity_at,
    remaining_servings,
    email_notifications,
    app_notifications,
    -- Cost tracking fields
    ai_trainings_count,
    ai_training_5_count,
    ai_training_15_count,
    ai_training_25_count,
    ai_prompts_count,
    ai_training_cost_per_unit,
    ai_prompt_cost_per_unit,
    revenue_from_client_local,
    exchange_rate_at_conversion
  ) VALUES (
    lead_record.restaurant_name,
    lead_record.contact_name,
    lead_record.phone,
    lead_record.email,
    p_lead_id,
    'פעיל',
    internal_notes_data::text,
    lead_record.notes,
    lead_record.address,
    lead_record.website_url,
    lead_record.business_type,
    now(),
    now(),
    0, -- Default servings
    true, -- Default email notifications
    true, -- Default app notifications
    -- Transfer all cost data from lead
    COALESCE(lead_record.ai_trainings_count, 0),
    COALESCE(lead_record.ai_training_5_count, 0),
    COALESCE(lead_record.ai_training_15_count, 0),
    COALESCE(lead_record.ai_training_25_count, 0),
    COALESCE(lead_record.ai_prompts_count, 0),
    COALESCE(lead_record.ai_training_cost_per_unit, 1.50),
    COALESCE(lead_record.ai_prompt_cost_per_unit, 0.162),
    COALESCE(lead_record.revenue_from_lead_local, 0.00),
    lead_record.exchange_rate_at_conversion
  ) RETURNING client_id INTO new_client_id;
  
  -- Update lead status and link to client
  UPDATE leads 
  SET 
    lead_status = 'הפך ללקוח',
    client_id = new_client_id,
    updated_at = now()
  WHERE lead_id = p_lead_id;
  
  -- Log the conversion activity
  INSERT INTO lead_activity_log (lead_id, activity_description)
  VALUES (p_lead_id, 'הליד הומר ללקוח חדש עם העברת נתוני עלויות. Client ID: ' || new_client_id::text);
  
  RAISE LOG 'Successfully converted lead % to new client % with preserved cost data', p_lead_id, new_client_id;
  
  RETURN new_client_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error converting lead % to client: %', p_lead_id, SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_client(uuid) TO service_role;

-- Add comment explaining the enhanced function
COMMENT ON FUNCTION public.convert_lead_to_client(uuid) IS 
'Enhanced function to convert a lead to a client with complete field synchronization including ALL cost tracking data, revenue, ROI calculations, and comprehensive financial information preservation';

COMMIT; 