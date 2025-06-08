-- Enhanced convert_lead_to_client RPC function to sync all lead information
-- This migration ensures complete data synchronization from leads to clients

BEGIN;

-- Drop and recreate the convert_lead_to_client function with enhanced field synchronization
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
    -- Link lead to existing client and merge comments
    
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
    
    -- Update client with merged data
    internal_notes_data := jsonb_build_object(
      'clientComments', comments_json,
      'originalNotes', COALESCE(internal_notes_data->>'originalNotes', ''),
      'leadNotes', COALESCE(lead_record.notes, ''),
      'mergedFromLead', p_lead_id::text
    );
    
    UPDATE clients 
    SET 
      internal_notes = internal_notes_data::text,
      last_activity_at = now()
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
    VALUES (p_lead_id, 'הליד קושר ללקוח קיים: ' || existing_client_id::text);
    
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
  
  -- Create new client record with comprehensive field mapping
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
    app_notifications
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
    true  -- Default app notifications
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
  VALUES (p_lead_id, 'הליד הומר ללקוח חדש. Client ID: ' || new_client_id::text);
  
  RAISE LOG 'Successfully converted lead % to new client % with preserved comments', p_lead_id, new_client_id;
  
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
'Enhanced function to convert a lead to a client with complete field synchronization including address, website, business type, activity history, and properly formatted comments preservation in JSON format';

COMMIT; 