-- Enable RLS on tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Policies for clients table
CREATE POLICY "Admins have full access to clients"
ON public.clients
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Customers can view and update their own client record"
ON public.clients
FOR SELECT
TO authenticated
USING (auth.uid() = user_auth_id);

CREATE POLICY "Customers can update their own contact details"
ON public.clients
FOR UPDATE
TO authenticated
USING (auth.uid() = user_auth_id)
WITH CHECK (auth.uid() = user_auth_id);

-- Policies for customer_submissions table
CREATE POLICY "Admins have full access to submissions"
ON public.customer_submissions
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Editors can access assigned submissions"
ON public.customer_submissions
FOR ALL
TO authenticated
USING (
  assigned_editor_id = auth.uid() OR
  auth.jwt()->>'role' = 'editor'
);

CREATE POLICY "Customers can view their own submissions"
ON public.customer_submissions
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.clients 
    WHERE user_auth_id = auth.uid()
  )
);

CREATE POLICY "Customers can create new submissions"
ON public.customer_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.clients 
    WHERE user_auth_id = auth.uid()
  )
);

CREATE POLICY "Customers can update submission feedback and approval"
ON public.customer_submissions
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT client_id 
    FROM public.clients 
    WHERE user_auth_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT client_id 
    FROM public.clients 
    WHERE user_auth_id = auth.uid()
  )
);

-- Policies for leads table
CREATE POLICY "Admins have full access to leads"
ON public.leads
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Anyone can create a lead"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policies for service_packages table
CREATE POLICY "Anyone can view active packages"
ON public.service_packages
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins can manage packages"
ON public.service_packages
FOR ALL
TO authenticated
USING (auth.jwt()->>'role' = 'admin'); 