-- Add package management fields to affiliates table (similar to clients)
ALTER TABLE public.affiliates 
ADD COLUMN IF NOT EXISTS current_package_id UUID REFERENCES public.service_packages(package_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS remaining_servings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_images INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumed_images INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_images INTEGER DEFAULT 0;

-- Create affiliate_assigned_packages table (similar to client_packages)
CREATE TABLE IF NOT EXISTS public.affiliate_assigned_packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
    package_name TEXT NOT NULL,
    total_dishes INTEGER NOT NULL,
    remaining_dishes INTEGER NOT NULL,
    total_images INTEGER NOT NULL,
    remaining_images INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    package_id UUID REFERENCES public.service_packages(package_id),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT remaining_dishes_check CHECK ((remaining_dishes >= 0) AND (remaining_dishes <= total_dishes)),
    CONSTRAINT remaining_images_check CHECK ((remaining_images >= 0) AND (remaining_images <= total_images))
);

-- Create activity log for affiliate package tracking
CREATE TABLE IF NOT EXISTS public.affiliate_package_activity_log (
    activity_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    affiliate_id UUID REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'manual_adjustment', 'package_assigned', etc.
    servings_before INTEGER NOT NULL,
    servings_after INTEGER NOT NULL,
    images_before INTEGER NOT NULL,
    images_after INTEGER NOT NULL,
    change_amount_servings INTEGER NOT NULL,
    change_amount_images INTEGER NOT NULL,
    description TEXT,
    created_by UUID, -- admin user who made the change
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_affiliates_current_package_id ON public.affiliates(current_package_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_assigned_packages_affiliate_id ON public.affiliate_assigned_packages(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_activity_log_affiliate_id ON public.affiliate_package_activity_log(affiliate_id);

-- Enable RLS for new tables
ALTER TABLE public.affiliate_assigned_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_package_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for affiliate_assigned_packages
CREATE POLICY "Affiliates can view their assigned packages" ON public.affiliate_assigned_packages
    FOR ALL USING (
        affiliate_id IN (
            SELECT affiliate_id FROM public.affiliates 
            WHERE user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all affiliate assigned packages" ON public.affiliate_assigned_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- RLS policies for affiliate_package_activity_log
CREATE POLICY "Affiliates can view their activity log" ON public.affiliate_package_activity_log
    FOR SELECT USING (
        affiliate_id IN (
            SELECT affiliate_id FROM public.affiliates 
            WHERE user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all affiliate activity logs" ON public.affiliate_package_activity_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON COLUMN public.affiliates.current_package_id IS 'Currently assigned package ID (similar to clients)';
COMMENT ON COLUMN public.affiliates.remaining_servings IS 'Number of servings remaining from current package allocation';
COMMENT ON COLUMN public.affiliates.remaining_images IS 'Number of images remaining from current package allocation';
COMMENT ON COLUMN public.affiliates.consumed_images IS 'Total number of images consumed/approved for this affiliate';
COMMENT ON COLUMN public.affiliates.reserved_images IS 'Number of images reserved for submissions in processing'; 