-- Add Astria integration fields to customer_submissions table
-- Based on exact database structure from backup file

BEGIN;

-- Add Astria integration fields to customer_submissions table
ALTER TABLE public.customer_submissions 
ADD COLUMN IF NOT EXISTS astria_tune_id TEXT,
ADD COLUMN IF NOT EXISTS astria_prompt_ids JSONB DEFAULT '[]'::jsonb;

-- Create visual_styles table for dynamic prompt management
CREATE TABLE IF NOT EXISTS public.visual_styles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  prompt_fragment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_submissions_astria_tune_id 
ON public.customer_submissions(astria_tune_id);

CREATE INDEX IF NOT EXISTS idx_visual_styles_name 
ON public.visual_styles(name);

-- Insert default visual styles for dynamic prompt management
INSERT INTO public.visual_styles (name, prompt_fragment)
SELECT * FROM (VALUES
  ('Magazine Shoot', 'professional food photography, magazine style, vibrant colors, sharp focus, high-end restaurant presentation'),
  ('Rustic Vibe', 'rustic wooden table, natural lighting, cozy atmosphere, artisanal presentation, warm tones'),
  ('Clean White', 'clean white background, minimal styling, product photography, bright lighting, professional'),
  ('Social Media', 'Instagram-worthy, trendy plating, colorful background, appealing to young audience'),
  ('Luxury Fine Dining', 'elegant plating, sophisticated presentation, fine dining atmosphere, premium quality'),
  ('Street Food Style', 'casual presentation, authentic street food vibe, vibrant colors, appetizing close-up')
) AS default_styles(name, prompt_fragment)
WHERE NOT EXISTS (SELECT 1 FROM public.visual_styles);

-- Add trigger for updated_at on visual_styles
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_visual_styles_updated_at ON public.visual_styles;
CREATE TRIGGER set_visual_styles_updated_at
BEFORE UPDATE ON public.visual_styles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON COLUMN public.customer_submissions.astria_tune_id IS 'Unique ID for Astria fine-tuning job';
COMMENT ON COLUMN public.customer_submissions.astria_prompt_ids IS 'Array of Astria prompt IDs for image generation';
COMMENT ON TABLE public.visual_styles IS 'Visual style prompts for AI image generation - used by VisualStyleGrid component';

COMMIT; 