BEGIN;

-- Create affiliates table
CREATE TABLE IF NOT EXISTS public.affiliates (
    affiliate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    
    -- Commission rates for different package types
    commission_rate_tasting DECIMAL(5,2) DEFAULT 30.00,
    commission_rate_full_menu DECIMAL(5,2) DEFAULT 25.00,
    commission_rate_deluxe DECIMAL(5,2) DEFAULT 20.00,
    
    -- Statistics
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_referrals INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_clients table (for linking clients to affiliates)
CREATE TABLE IF NOT EXISTS public.affiliate_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
    referral_method VARCHAR(50) DEFAULT 'name_reference' CHECK (referral_method IN ('name_reference', 'direct_link')),
    referral_source TEXT,
    referred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    
    UNIQUE(client_id) -- A client can only be linked to one affiliate
);

-- Create affiliate_packages table (for package bulk purchases)
CREATE TABLE IF NOT EXISTS public.affiliate_packages (
    package_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('tasting', 'full_menu', 'deluxe')),
    
    -- Package content
    total_dishes INTEGER NOT NULL,
    total_images INTEGER NOT NULL,
    purchase_price DECIMAL(10,2) NOT NULL,
    
    -- Usage tracking
    dishes_used INTEGER DEFAULT 0,
    images_used INTEGER DEFAULT 0,
    
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'depleted', 'inactive'))
);

-- Create affiliate_package_allocations table (for distributing packages to clients)
CREATE TABLE IF NOT EXISTS public.affiliate_package_allocations (
    allocation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_package_id UUID NOT NULL REFERENCES public.affiliate_packages(package_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
    
    -- Allocated amounts
    allocated_dishes INTEGER NOT NULL,
    allocated_images INTEGER NOT NULL,
    
    -- Usage tracking
    dishes_used INTEGER DEFAULT 0,
    images_used INTEGER DEFAULT 0,
    
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Create affiliate_commissions table (for tracking commissions)
CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
    commission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES public.affiliates(affiliate_id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(client_id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('referral_commission', 'package_profit')),
    package_type VARCHAR(50) CHECK (package_type IN ('tasting', 'full_menu', 'deluxe')),
    
    -- Financial details
    base_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment tracking
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for affiliates table
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their own data" ON public.affiliates
    FOR ALL USING (user_auth_id = auth.uid());

CREATE POLICY "Admins can view all affiliates" ON public.affiliates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add RLS policies for affiliate_clients table
ALTER TABLE public.affiliate_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their linked clients" ON public.affiliate_clients
    FOR ALL USING (
        affiliate_id IN (
            SELECT affiliate_id FROM public.affiliates 
            WHERE user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all affiliate clients" ON public.affiliate_clients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add RLS policies for affiliate_packages table
ALTER TABLE public.affiliate_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their packages" ON public.affiliate_packages
    FOR ALL USING (
        affiliate_id IN (
            SELECT affiliate_id FROM public.affiliates 
            WHERE user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all affiliate packages" ON public.affiliate_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add RLS policies for affiliate_package_allocations table
ALTER TABLE public.affiliate_package_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their allocations" ON public.affiliate_package_allocations
    FOR ALL USING (
        affiliate_package_id IN (
            SELECT package_id FROM public.affiliate_packages ap
            JOIN public.affiliates a ON ap.affiliate_id = a.affiliate_id
            WHERE a.user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all allocations" ON public.affiliate_package_allocations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add RLS policies for affiliate_commissions table
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view their commissions" ON public.affiliate_commissions
    FOR ALL USING (
        affiliate_id IN (
            SELECT affiliate_id FROM public.affiliates 
            WHERE user_auth_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all commissions" ON public.affiliate_commissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_affiliates_user_auth_id ON public.affiliates(user_auth_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_email ON public.affiliates(email);
CREATE INDEX IF NOT EXISTS idx_affiliate_clients_affiliate_id ON public.affiliate_clients(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clients_client_id ON public.affiliate_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_packages_affiliate_id ON public.affiliate_packages(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_allocations_package_id ON public.affiliate_package_allocations(affiliate_package_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_allocations_client_id ON public.affiliate_package_allocations(client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON public.affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_client_id ON public.affiliate_commissions(client_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT; 