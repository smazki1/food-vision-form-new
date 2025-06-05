-- Add RPC function for creating service packages
-- This is needed because RLS policies block direct INSERT operations

BEGIN;

-- Create RPC function for creating packages
CREATE OR REPLACE FUNCTION public.create_service_package(
  p_package_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_total_servings INTEGER DEFAULT NULL,
  p_price DECIMAL DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_max_processing_time_days INTEGER DEFAULT NULL,
  p_max_edits_per_serving INTEGER DEFAULT NULL,
  p_special_notes TEXT DEFAULT NULL,
  p_total_images INTEGER DEFAULT NULL
)
RETURNS service_packages
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_package service_packages;
BEGIN
  -- Insert the new package
  INSERT INTO public.service_packages (
    package_name,
    description,
    total_servings,
    price,
    is_active,
    max_processing_time_days,
    max_edits_per_serving,
    special_notes,
    total_images,
    created_at,
    updated_at
  ) VALUES (
    p_package_name,
    p_description,
    p_total_servings,
    p_price,
    COALESCE(p_is_active, TRUE),
    p_max_processing_time_days,
    p_max_edits_per_serving,
    p_special_notes,
    p_total_images,
    NOW(),
    NOW()
  ) RETURNING * INTO v_new_package;

  RETURN v_new_package;
END;
$$;

-- Grant execute permissions to authenticated users (admin access will be handled by auth logic)
GRANT EXECUTE ON FUNCTION public.create_service_package(
  TEXT, TEXT, INTEGER, DECIMAL, BOOLEAN, INTEGER, INTEGER, TEXT, INTEGER
) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.create_service_package IS 'Create a new service package (admin only)';

COMMIT; 