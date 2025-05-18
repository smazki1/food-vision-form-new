-- Temporarily disable RLS
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on clients table
DROP POLICY IF EXISTS "admin_full_access_clients" ON public.clients;
DROP POLICY IF EXISTS "customers_view_own_client" ON public.clients;
DROP POLICY IF EXISTS "customers_update_own_client" ON public.clients;

-- Create simplified policies without type casting
CREATE POLICY "clients_select_own"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_auth_id);

CREATE POLICY "clients_update_own"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_auth_id)
WITH CHECK (auth.uid() = user_auth_id);

CREATE POLICY "admin_full_access"
ON public.clients
FOR ALL
TO authenticated
USING (public.is_admin());

-- Re-enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Verify the policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'clients' 
    AND policyname = 'clients_select_own'
  ) THEN
    RAISE EXCEPTION 'Critical policy "clients_select_own" was not created successfully';
  END IF;
END $$; 