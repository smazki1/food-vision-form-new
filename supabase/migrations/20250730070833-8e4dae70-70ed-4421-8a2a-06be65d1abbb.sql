-- Fix remaining RLS disabled tables

-- Enable RLS on remaining tables that need protection
ALTER TABLE public.dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cocktails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visual_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_comments ENABLE ROW LEVEL SECURITY;

-- Add basic policies for these tables

-- Dishes policies
CREATE POLICY "Admins can manage all dishes"
ON public.dishes
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own dishes"
ON public.dishes
FOR SELECT
USING (
  client_id IN (
    SELECT c.client_id FROM public.clients c 
    WHERE c.user_auth_id = auth.uid()
  )
);

-- Drinks policies
CREATE POLICY "Admins can manage all drinks"
ON public.drinks
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own drinks"
ON public.drinks
FOR SELECT
USING (
  client_id IN (
    SELECT c.client_id FROM public.clients c 
    WHERE c.user_auth_id = auth.uid()
  )
);

-- Cocktails policies
CREATE POLICY "Admins can manage all cocktails"
ON public.cocktails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

CREATE POLICY "Clients can view their own cocktails"
ON public.cocktails
FOR SELECT
USING (
  client_id IN (
    SELECT c.client_id FROM public.clients c 
    WHERE c.user_auth_id = auth.uid()
  )
);

-- Visual styles policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view visual styles"
ON public.visual_styles
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage visual styles"
ON public.visual_styles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Lead activity log policies
CREATE POLICY "Admins can manage lead activity logs"
ON public.lead_activity_log
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Lead comments policies
CREATE POLICY "Admins can manage lead comments"
ON public.lead_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);