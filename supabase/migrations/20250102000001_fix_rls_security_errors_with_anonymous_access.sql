-- Fix RLS security errors while maintaining anonymous upload functionality
-- This migration enables RLS and creates proper policies for anonymous users
-- Resolves: policy_exists_rls_disabled and rls_disabled_in_public errors

-- Enable RLS on dishes table
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on cocktails table  
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;

-- Enable RLS on drinks table
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;

-- Drop any existing problematic policies first
DROP POLICY IF EXISTS "authenticated_users_can_insert_dishes" ON public.dishes;
DROP POLICY IF EXISTS "authenticated_users_can_insert_cocktails" ON public.cocktails;
DROP POLICY IF EXISTS "authenticated_users_can_insert_drinks" ON public.drinks;

-- DISHES TABLE POLICIES
-- Allow anonymous users to insert dishes (for public form submissions)
CREATE POLICY "anonymous_users_can_insert_dishes" ON public.dishes
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to insert dishes
CREATE POLICY "authenticated_users_can_insert_dishes" ON public.dishes
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow clients to view their own dishes
CREATE POLICY "clients_can_view_own_dishes" ON public.dishes
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT get_user_client_id())
        OR is_admin()
        OR is_editor()
    );

-- Allow admins and editors to manage all dishes
CREATE POLICY "admins_can_manage_all_dishes" ON public.dishes
    FOR ALL TO authenticated
    USING (is_admin() OR is_editor())
    WITH CHECK (is_admin() OR is_editor());

-- COCKTAILS TABLE POLICIES  
-- Allow anonymous users to insert cocktails (for public form submissions)
CREATE POLICY "anonymous_users_can_insert_cocktails" ON public.cocktails
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to insert cocktails
CREATE POLICY "authenticated_users_can_insert_cocktails" ON public.cocktails
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow clients to view their own cocktails
CREATE POLICY "clients_can_view_own_cocktails" ON public.cocktails
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT get_user_client_id())
        OR is_admin()
        OR is_editor()
    );

-- Allow admins and editors to manage all cocktails
CREATE POLICY "admins_can_manage_all_cocktails" ON public.cocktails
    FOR ALL TO authenticated
    USING (is_admin() OR is_editor())
    WITH CHECK (is_admin() OR is_editor());

-- DRINKS TABLE POLICIES
-- Allow anonymous users to insert drinks (for public form submissions)
CREATE POLICY "anonymous_users_can_insert_drinks" ON public.drinks
    FOR INSERT TO anon
    WITH CHECK (true);

-- Allow authenticated users to insert drinks
CREATE POLICY "authenticated_users_can_insert_drinks" ON public.drinks
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow clients to view their own drinks
CREATE POLICY "clients_can_view_own_drinks" ON public.drinks
    FOR SELECT TO authenticated
    USING (
        client_id = (SELECT get_user_client_id())
        OR is_admin()
        OR is_editor()
    );

-- Allow admins and editors to manage all drinks
CREATE POLICY "admins_can_manage_all_drinks" ON public.drinks
    FOR ALL TO authenticated
    USING (is_admin() OR is_editor())
    WITH CHECK (is_admin() OR is_editor());

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('dishes', 'cocktails', 'drinks'); 