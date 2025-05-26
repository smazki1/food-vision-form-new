
-- Update the public submission RPC function to match frontend expectations
DROP FUNCTION IF EXISTS public.public_submit_item_by_restaurant_name(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], NUMERIC, TEXT[]);

CREATE OR REPLACE FUNCTION public.public_submit_item_by_restaurant_name(
    p_restaurant_name TEXT,
    p_item_type TEXT,
    p_item_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_ingredients TEXT[] DEFAULT NULL,
    p_reference_image_urls TEXT[] DEFAULT '{}'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_client_id uuid;
    v_submission_id uuid;
    v_item_id uuid;
    v_result json;
BEGIN
    -- Validate item type
    IF p_item_type NOT IN ('dish', 'cocktail', 'drink') THEN
        RAISE EXCEPTION 'Invalid item type. Must be dish, cocktail, or drink';
    END IF;

    -- Try to find the client by restaurant name (case insensitive, trimmed)
    SELECT client_id INTO v_client_id
    FROM public.clients
    WHERE LOWER(TRIM(restaurant_name)) = LOWER(TRIM(p_restaurant_name))
    LIMIT 1;

    -- Create the actual item in the appropriate table first
    IF p_item_type = 'dish' THEN
        INSERT INTO public.dishes (
            client_id,
            name,
            description,
            category,
            reference_image_urls
        ) VALUES (
            v_client_id,
            p_item_name,
            p_description,
            p_category,
            p_reference_image_urls
        ) RETURNING dish_id INTO v_item_id;
        
    ELSIF p_item_type = 'cocktail' THEN
        INSERT INTO public.cocktails (
            client_id,
            name,
            description,
            ingredients_array,
            reference_image_urls
        ) VALUES (
            v_client_id,
            p_item_name,
            p_description,
            p_ingredients,
            p_reference_image_urls
        ) RETURNING cocktail_id INTO v_item_id;
        
    ELSIF p_item_type = 'drink' THEN
        INSERT INTO public.drinks (
            client_id,
            name,
            description,
            category,
            reference_image_urls
        ) VALUES (
            v_client_id,
            p_item_name,
            p_description,
            p_category,
            p_reference_image_urls
        ) RETURNING drink_id INTO v_item_id;
    END IF;

    -- Create submission record
    INSERT INTO public.customer_submissions (
        client_id,
        original_item_id,
        item_type,
        item_name_at_submission,
        submission_status,
        original_image_urls
    ) VALUES (
        v_client_id,
        v_item_id,
        p_item_type,
        p_item_name,
        'ממתינה לעיבוד',
        p_reference_image_urls
    ) RETURNING submission_id INTO v_submission_id;

    -- Return result in expected format
    v_result := json_build_object(
        'success', true,
        'submission_id', v_submission_id,
        'item_id', v_item_id,
        'client_found', v_client_id IS NOT NULL,
        'client_id', v_client_id,
        'message', CASE 
            WHEN v_client_id IS NOT NULL THEN 
                'הפריט נוסף בהצלחה ושויך למסעדה'
            ELSE 
                'הפריט נוסף בהצלחה. המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני'
        END
    );

    RETURN v_result;
END;
$$;

-- Grant execution to the anon role
GRANT EXECUTE ON FUNCTION public.public_submit_item_by_restaurant_name(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[]) TO anon;

-- Create storage bucket for food vision images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-vision-images', 'food-vision-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies to allow public uploads
CREATE POLICY IF NOT EXISTS "Public read access for food-vision-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'food-vision-images');

CREATE POLICY IF NOT EXISTS "Public upload access for food-vision-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'food-vision-images');

CREATE POLICY IF NOT EXISTS "Public update access for food-vision-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'food-vision-images');

CREATE POLICY IF NOT EXISTS "Public delete access for food-vision-images"
ON storage.objects FOR DELETE
USING (bucket_id = 'food-vision-images');
