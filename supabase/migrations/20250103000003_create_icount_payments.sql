-- Create icount_payments table to track payments from webhooks
CREATE TABLE IF NOT EXISTS public.icount_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- iCount webhook data
    icount_doc_id TEXT NOT NULL UNIQUE, -- iCount document ID
    icount_doc_type TEXT NOT NULL, -- Document type from iCount
    payment_amount DECIMAL(10,2) NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_name TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Auto-detected package info based on amount
    detected_package_type TEXT CHECK (detected_package_type IN ('tasting', 'full_menu', 'deluxe')),
    
    -- Admin assignment
    affiliate_id UUID REFERENCES public.affiliates(affiliate_id) ON DELETE SET NULL,
    assigned_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
    admin_notes TEXT,
    
    -- Full webhook payload for debugging
    webhook_payload JSONB NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_icount_payments_status ON public.icount_payments(status);
CREATE INDEX IF NOT EXISTS idx_icount_payments_email ON public.icount_payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_icount_payments_amount ON public.icount_payments(payment_amount);
CREATE INDEX IF NOT EXISTS idx_icount_payments_affiliate ON public.icount_payments(affiliate_id);

-- Enable RLS
ALTER TABLE public.icount_payments ENABLE ROW LEVEL SECURITY;

-- Admin can see all payments
CREATE POLICY "Admins can view all icount payments" ON public.icount_payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@foodvision.co.il', 'avi@lovable.dev')
        )
    );

-- Admin can update all payments
CREATE POLICY "Admins can update all icount payments" ON public.icount_payments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.email IN ('admin@foodvision.co.il', 'avi@lovable.dev')
        )
    );

-- System can insert payments (from webhook)
CREATE POLICY "System can insert icount payments" ON public.icount_payments
    FOR INSERT WITH CHECK (true);

-- Create function to auto-detect package type based on amount
CREATE OR REPLACE FUNCTION detect_package_type(amount DECIMAL)
RETURNS TEXT AS $$
BEGIN
    -- Package pricing: tasting=550, full_menu=990, deluxe=1690
    IF amount = 550.00 THEN
        RETURN 'tasting';
    ELSIF amount = 990.00 THEN
        RETURN 'full_menu';  
    ELSIF amount = 1690.00 THEN
        RETURN 'deluxe';
    ELSE
        RETURN NULL; -- Unknown amount
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-detect package type
CREATE OR REPLACE FUNCTION set_detected_package_type()
RETURNS TRIGGER AS $$
BEGIN
    NEW.detected_package_type = detect_package_type(NEW.payment_amount);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_detected_package_type
    BEFORE INSERT OR UPDATE ON public.icount_payments
    FOR EACH ROW
    EXECUTE FUNCTION set_detected_package_type(); 