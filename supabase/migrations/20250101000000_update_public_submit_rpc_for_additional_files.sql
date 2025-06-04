-- Update the public_submit_item_by_restaurant_name RPC function to support additional files
-- and fix column name issues

BEGIN;

-- Drop the current function
DROP FUNCTION IF EXISTS public.public_submit_item_by_restaurant_name(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT, TEXT);

-- Create the updated function with additional file support
CREATE OR REPLACE FUNCTION public.public_submit_item_by_restaurant_name(
  p_restaurant_name TEXT,
  p_item_type TEXT,
  p_item_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_ingredients TEXT[] DEFAULT NULL,
  p_reference_image_urls TEXT[] DEFAULT '{}',
  p_branding_material_urls TEXT[] DEFAULT '{}',
  p_reference_example_urls TEXT[] DEFAULT '{}',
  p_contact_name TEXT DEFAULT NULL,
  p_contact_email TEXT DEFAULT NULL,
  p_contact_phone TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_lead_id UUID;
  v_client_id UUID;
  v_submission_id UUID;
  v_new_lead_created BOOLEAN := FALSE;
  v_client_found BOOLEAN := FALSE;
  v_lead_found BOOLEAN := FALSE;
  v_result JSON;
BEGIN
  RAISE LOG 'Entering public_submit_item_by_restaurant_name for restaurant: %', p_restaurant_name;
  RAISE LOG 'Additional files - branding: %, reference: %', array_length(p_branding_material_urls, 1), array_length(p_reference_example_urls, 1);

  -- First, check if a client exists for this restaurant
  SELECT client_id INTO v_client_id 
  FROM public.clients 
  WHERE lower(restaurant_name) = lower(p_restaurant_name) 
  LIMIT 1;
  
  IF v_client_id IS NOT NULL THEN
    v_client_found := TRUE;
    RAISE LOG 'Found existing client: %', v_client_id;
  END IF;

  -- Check if a lead already exists for this restaurant (regardless of client)
  SELECT lead_id INTO v_lead_id 
  FROM public.leads 
  WHERE lower(restaurant_name) = lower(p_restaurant_name)
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_lead_id IS NOT NULL THEN
    v_lead_found := TRUE;
    RAISE LOG 'Found existing lead: %', v_lead_id;
  END IF;

  -- If no lead exists, create a new one
  IF v_lead_id IS NULL THEN
    INSERT INTO public.leads (
      restaurant_name,
      contact_name,
      phone,
      email,  -- Fixed: using 'email' instead of 'contact_email'
      lead_status,
      lead_source,
      notes,
      created_at,
      updated_at
    ) VALUES (
      p_restaurant_name,
      p_contact_name,
      p_contact_phone,
      p_contact_email,
      'ליד חדש',
      'אתר',
      'נוצר אוטומטית מהגשת טופס באתר',
      NOW(),
      NOW()
    ) RETURNING lead_id INTO v_lead_id;
    
    v_new_lead_created := TRUE;
    RAISE LOG 'Created new lead: %', v_lead_id;
  END IF;

  -- Create the submission in customer_submissions table
  INSERT INTO public.customer_submissions (
    client_id,
    lead_id,
    created_lead_id,
    original_item_id,
    item_type,
    item_name_at_submission,
    submission_status,
    original_image_urls,
    branding_material_urls,
    reference_example_urls,
    restaurant_name,
    contact_name,
    email,
    phone,
    uploaded_at
  ) VALUES (
    v_client_id, -- NULL if no client found
    CASE WHEN v_client_found THEN NULL ELSE v_lead_id END, -- Link to lead only if no client
    CASE WHEN v_new_lead_created THEN v_lead_id ELSE NULL END, -- Track if we created the lead
    gen_random_uuid(), -- Generate a unique item ID
    p_item_type,
    p_item_name,
    'ממתינה לעיבוד',
    p_reference_image_urls,
    p_branding_material_urls,
    p_reference_example_urls,
    p_restaurant_name,
    p_contact_name,
    p_contact_email,
    p_contact_phone,
    NOW()
  ) RETURNING submission_id INTO v_submission_id;

  RAISE LOG 'Created submission: %', v_submission_id;

  -- Prepare the result
  v_result := json_build_object(
    'success', TRUE,
    'submission_id', v_submission_id,
    'lead_id', v_lead_id,
    'client_id', v_client_id,
    'client_found', v_client_found,
    'lead_created', v_new_lead_created,
    'lead_found', v_lead_found,
    'message', CASE 
      WHEN v_client_found THEN 'הפריט הוגש בהצלחה ושויך למסעדה!'
      WHEN v_new_lead_created THEN 'הפריט הוגש בהצלחה! נוצר ליד חדש למסעדה במערכת.'
      ELSE 'הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.'
    END
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in public_submit_item_by_restaurant_name: %', SQLERRM;
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'message', 'שגיאה בעיבוד ההגשה: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users (for public form submissions)
GRANT EXECUTE ON FUNCTION public.public_submit_item_by_restaurant_name(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT, TEXT, TEXT
) TO anon;

GRANT EXECUTE ON FUNCTION public.public_submit_item_by_restaurant_name(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT[], TEXT[], TEXT, TEXT, TEXT
) TO authenticated;

COMMIT; 