-- Add image tracking fields to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS remaining_images INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consumed_images INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reserved_images INTEGER DEFAULT 0;

-- Add image tracking fields to customer_submissions table  
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS processed_image_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS image_credits_used INTEGER DEFAULT 0;

-- Create activity log for image tracking
CREATE TABLE IF NOT EXISTS public.client_image_activity_log (
  activity_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(client_id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.customer_submissions(submission_id) ON DELETE SET NULL,
  activity_type VARCHAR(50) NOT NULL, -- 'manual_adjustment', 'submission_approved', 'package_assigned', etc.
  images_before INTEGER NOT NULL,
  images_after INTEGER NOT NULL,
  change_amount INTEGER NOT NULL,
  description TEXT,
  created_by UUID, -- admin user who made the change
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_client_image_activity_client_id 
ON public.client_image_activity_log(client_id);

CREATE INDEX IF NOT EXISTS idx_client_image_activity_submission_id 
ON public.client_image_activity_log(submission_id);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.remaining_images IS 'Number of images remaining from current package allocation';
COMMENT ON COLUMN public.clients.consumed_images IS 'Total number of images consumed/approved for this client';
COMMENT ON COLUMN public.clients.reserved_images IS 'Number of images reserved for submissions in processing';
COMMENT ON COLUMN public.customer_submissions.processed_image_count IS 'Number of images generated for this submission';
COMMENT ON COLUMN public.customer_submissions.image_credits_used IS 'Number of image credits consumed for this submission';
COMMENT ON TABLE public.client_image_activity_log IS 'Audit trail for all image credit changes'; 