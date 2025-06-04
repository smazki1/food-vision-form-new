-- Remove the check constraint that limits item_type to specific values
-- This allows the form to accept any custom item type (jewelry, etc.)

ALTER TABLE public.customer_submissions 
DROP CONSTRAINT IF EXISTS valid_item_type;

-- Add a comment to document this change
COMMENT ON COLUMN public.customer_submissions.item_type IS 'Item type - now accepts any text value to support various business types (restaurants, jewelry, etc.)'; 