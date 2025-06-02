-- supabase/migrations/20240723100000_setup_get_my_role_function.sql

-- Drop the function if it already exists to ensure a clean recreation
-- DROP FUNCTION IF EXISTS public.get_my_role();

-- Create the get_my_role function
-- CREATE OR REPLACE FUNCTION public.get_my_role()
-- RETURNS text
-- LANGUAGE plpgsql
-- SECURITY DEFINER
-- SET search_path TO 'public', 'extensions', 'pg_catalog' 
-- AS $function$
-- DECLARE
--   user_role_value TEXT;
-- BEGIN
--   SELECT role
--   INTO user_role_value
--   FROM public.user_roles
--   WHERE user_id = auth.uid();
-- 
--   RETURN user_role_value;
-- END;
-- $function$;

-- Grant EXECUTE permission on the function to the 'authenticated' role
-- GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- Optional: Add a comment to the function for better understanding in the future
-- COMMENT ON FUNCTION public.get_my_role() IS 'Retrieves the role of the currently authenticated user from the user_roles table. Returns NULL if no role is found.'; 