-- Create user_password_references table for admin access to user passwords
CREATE TABLE IF NOT EXISTS public.user_password_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_reference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure only one password reference per user
    UNIQUE(user_id)
);

-- Add RLS policies for admin-only access
ALTER TABLE public.user_password_references ENABLE ROW LEVEL SECURITY;

-- Only admins can view password references
CREATE POLICY "admin_only_access_password_references"
ON public.user_password_references
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'admin'
    )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_password_references_user_id 
ON public.user_password_references(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_password_references IS 'Stores password references for admin access to user accounts (for support purposes only)';
COMMENT ON COLUMN public.user_password_references.password_reference IS 'Plain text password reference for admin support (use with caution)';
COMMENT ON COLUMN public.user_password_references.created_by IS 'Admin user who created this password reference'; 