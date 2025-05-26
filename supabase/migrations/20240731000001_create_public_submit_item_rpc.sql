CREATE OR REPLACE FUNCTION public.public_submit_item_by_restaurant_name(
    p_restaurant_name TEXT,
    p_item_type TEXT,
    p_item_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_reference_image_urls TEXT[] DEFAULT '{}'
)
RETURNS uuid -- Returns the new item's ID
LANGUAGE plpgsql
-- Consider SECURITY DEFINER if RLS for anon role is too restrictive for direct table inserts.
-- For now, let's proceed without it and assume RLS can be configured appropriately or anon has insert grants.
AS $$
DECLARE
    target_client_id UUID;
    new_item_id UUID;
    item_table_name TEXT;
    item_id_column_name TEXT; -- This will hold 'dish_id', 'cocktail_id', or 'drink_id'
    v_submission_id UUID;
BEGIN
    -- 1. Validate item_type
    IF p_item_type NOT IN ('dish', 'cocktail', 'drink') THEN
        RAISE EXCEPTION 'Invalid item type: %. Must be one of "dish", "cocktail", "drink".', p_item_type;
    END IF;

    -- 2. Determine target_client_id based on restaurant_name (exact match)
    SELECT client_id INTO target_client_id
    FROM public.clients
    WHERE restaurant_name = p_restaurant_name
    LIMIT 1;
    -- If not found, target_client_id will be NULL, which is the desired behavior for unassigned items.

    -- 3. Generate new item ID (for the dish/cocktail/drink itself)
    new_item_id := gen_random_uuid();

    -- 4. Determine item table name and the name of its specific ID column
    CASE p_item_type
        WHEN 'dish' THEN
            item_table_name := 'dishes';
            item_id_column_name := 'dish_id'; 
        WHEN 'cocktail' THEN
            item_table_name := 'cocktails';
            item_id_column_name := 'cocktail_id';
        WHEN 'drink' THEN
            item_table_name := 'drinks';
            item_id_column_name := 'drink_id';
    END CASE;

    -- 5. Insert into the dynamic item table (dishes, cocktails, or drinks)
    EXECUTE format(
        'INSERT INTO public.%I (%I, client_id, name, description, notes, reference_image_urls) ' ||
        'VALUES ($1, $2, $3, $4, $5, $6)',
        item_table_name,        -- Table identifier, e.g., 'dishes'
        item_id_column_name     -- Item's specific ID column identifier, e.g., 'dish_id'
    )
    USING 
        new_item_id,            -- $1: Value for the item's specific ID (e.g., dish_id)
        target_client_id,       -- $2: Value for client_id
        p_item_name,            -- $3: Value for name
        p_description,          -- $4: Value for description
        p_notes,                -- $5: Value for notes
        p_reference_image_urls; -- $6: Value for reference_image_urls

    -- 6. Generate new submission_id for customer_submissions table
    v_submission_id := gen_random_uuid();

    -- 7. Insert into customer_submissions
    INSERT INTO public.customer_submissions (
        submission_id,
        client_id,
        original_item_id,
        item_type,
        item_name_at_submission,
        submission_status,
        original_image_urls 
    )
    VALUES (
        v_submission_id,    
        target_client_id,   
        new_item_id,        
        p_item_type,
        p_item_name,
        'ממתינה לעיבוד',     
        p_reference_image_urls
    );

    RETURN new_item_id; -- Return the ID of the main item (dish/cocktail/drink)
END;
$$;

-- Grant execution to the anon role to make it publicly callable
-- Ensure RLS policies on the target tables (dishes, cocktails, drinks, customer_submissions)
-- allow inserts from the 'anon' role or from the role this function executes as (if SECURITY DEFINER is used).
-- If RLS is strict, SECURITY DEFINER might be necessary, or more granular RLS policies.
GRANT EXECUTE ON FUNCTION public.public_submit_item_by_restaurant_name(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]) TO anon; 