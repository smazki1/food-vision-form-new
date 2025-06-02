CREATE OR REPLACE FUNCTION public.public_submit_item_by_restaurant_name(
  p_restaurant_name TEXT,
  p_contact_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_item_type TEXT,
  p_item_name TEXT,
  p_description TEXT,
  p_special_notes TEXT,
  p_category TEXT,
  p_image_urls JSONB
) RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
  v_client_id UUID;
  v_submission_id UUID;
  v_original_item_id UUID;
  v_user_id UUID;
  v_new_lead_status TEXT := 'ליד חדש'; -- Default status for new leads
  v_new_lead_source TEXT := 'אתר'; -- Default source for new leads from public submission

BEGIN
  RAISE LOG 'Entering public_submit_item_by_restaurant_name (10 params version) with phone: %', p_phone;

  -- Attempt to find an existing user by email (optional, depends on your user management)
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  -- Check if a lead or client already exists for this restaurant
  SELECT lead_id INTO v_lead_id 
  FROM public.leads 
  WHERE lower(restaurant_name) = lower(p_restaurant_name) OR lower(email) = lower(p_email);
  
  IF v_lead_id IS NULL THEN
    SELECT client_id INTO v_client_id 
    FROM public.clients 
    WHERE lower(restaurant_name) = lower(p_restaurant_name) OR lower(email) = lower(p_email);
  END IF;

  -- If no existing lead or client, create a new lead
  IF v_lead_id IS NULL AND v_client_id IS NULL THEN
    INSERT INTO public.leads (
      restaurant_name,
      contact_name,
      phone,       -- Corrected column name
      email,
      lead_status, -- Use variable for status
      lead_source, -- Use variable for source
      notes,       -- Assuming p_special_notes can be used as initial notes
      created_at,
      updated_at
      -- any other relevant fields for a new lead from submission
    ) VALUES (
      p_restaurant_name,
      p_contact_name,
      p_phone,     -- Corrected column name usage
      p_email,
      v_new_lead_status,
      v_new_lead_source,
      p_special_notes, -- Or a generic note like 'Initial submission from website'
      NOW(),
      NOW()
      -- values for other fields
    ) RETURNING lead_id INTO v_lead_id;
  END IF;
  
  -- If a client exists but no lead, we might want to create a lead and link it, 
  -- or directly create a submission linked to the client. 
  -- For now, this function assumes a lead should exist or be created.
  -- If v_client_id IS NOT NULL AND v_lead_id IS NULL, this case isn't explicitly creating a lead for that client.
  -- This might be an area to refine based on business logic.

  -- Ensure we have a lead_id to associate with the submission
  IF v_lead_id IS NULL AND v_client_id IS NOT NULL THEN
    -- Option: Create a new lead record for an existing client if a submission is made
    -- This might be desired if leads are used to track all interactions, even for existing clients
    -- Or, fetch the primary lead_id if multiple leads could link to one client (unlikely with current structure)
    -- For now, we'll assume the submission is primarily for new leads or existing leads.
    -- If the goal is to add items for existing clients, a different flow/RPC might be better.
    RAISE WARNING 'Submission for existing client (ID: %) but no direct lead found. Submission will not be linked to a new lead.', v_client_id;
    -- Set v_lead_id to null or a specific marker if submission should still proceed without a lead link
  ELSIF v_lead_id IS NULL AND v_client_id IS NULL THEN
    RAISE EXCEPTION 'Failed to create or find a lead for submission.';
  END IF;

  -- Create the submission linked to the lead (or client if logic is adapted)
  INSERT INTO public.submissions (
    lead_id, 
    -- client_id, -- if submissions can also be directly linked to clients
    user_id, 
    item_type, 
    item_name, 
    description, 
    special_notes, 
    category, 
    image_urls,
    submission_status, -- e.g., 'pending_review'
    submission_source,
    created_at,
    updated_at
  ) VALUES (
    v_lead_id, 
    -- v_client_id, 
    v_user_id, 
    p_item_type, 
    p_item_name, 
    p_description, 
    p_special_notes, 
    p_category, 
    p_image_urls,
    'pending_review', -- Example default status
    'public_form',    -- Example source
    NOW(),
    NOW()
  ) RETURNING submission_id, original_item_id INTO v_submission_id, v_original_item_id;

  RETURN v_submission_id; -- Or v_original_item_id depending on what needs to be returned

EXCEPTION
  WHEN OTHERS THEN
    -- Log error or handle as needed
    RAISE WARNING 'Error in public_submit_item_by_restaurant_name: %', SQLERRM;
    RETURN NULL; -- Or re-raise exception

END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 