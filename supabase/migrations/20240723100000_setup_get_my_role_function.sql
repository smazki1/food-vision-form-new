-- supabase/migrations/20240723100000_setup_get_my_role_function.sql

-- Drop the function if it already exists to ensure a clean recreation
DROP FUNCTION IF EXISTS public.get_my_role();

-- Create the get_my_role function
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
-- It's good practice to explicitly set search_path to avoid issues with object resolution
-- and to ensure the function behaves consistently regardless of the session's search_path.
-- 'public' should usually come first for user-defined objects.
-- 'extensions' schema is often used by Supabase for its extensions.
-- 'pg_catalog' is for built-in types and functions.
SET search_path TO 'public', 'extensions', 'pg_catalog' 
AS $function$
DECLARE
  user_role_value TEXT;
BEGIN
  -- Attempt to select the role for the currently authenticated user
  SELECT role
  INTO user_role_value
  FROM public.user_roles
  WHERE user_id = auth.uid();

  -- Return the found role, or NULL if no role was found for the user
  RETURN user_role_value;
END;
$function$;

-- Grant EXECUTE permission on the function to the 'authenticated' role
-- This allows any authenticated user to call this function via RPC.
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Optional: Add a comment to the function for better understanding in the future
COMMENT ON FUNCTION public.get_my_role() IS 'Retrieves the role of the currently authenticated user from the user_roles table. Returns NULL if no role is found.'; 