-- Add internal_notes column to affiliates table for admin notes
ALTER TABLE public.affiliates 
ADD COLUMN internal_notes TEXT;

-- Add comment explaining this field
COMMENT ON COLUMN public.affiliates.internal_notes IS 'Internal admin notes about the affiliate, not visible to affiliate'; 