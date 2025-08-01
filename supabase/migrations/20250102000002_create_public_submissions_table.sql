-- Create public_submissions table for anonymous users
-- This table bypasses RLS completely and serves as intake for public submissions

CREATE TABLE public_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Restaurant/Contact Info
  restaurant_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Item Details
  item_type TEXT NOT NULL CHECK (item_type IN ('dish', 'cocktail', 'drink')),
  item_name TEXT NOT NULL,
  description TEXT,
  special_notes TEXT,
  
  -- Files and URLs
  original_image_urls TEXT[] DEFAULT '{}',
  branding_material_urls TEXT[] DEFAULT '{}',
  reference_example_urls TEXT[] DEFAULT '{}',
  
  -- Processing Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  processed_by UUID NULL, -- admin user who processed it
  
  -- Additional Data
  category TEXT, -- for dishes
  ingredients TEXT[], -- for cocktails/drinks
  submission_data JSONB, -- any additional custom data
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- NO RLS on this table - this is the key to solving the problem!
-- ALTER TABLE public_submissions ENABLE ROW LEVEL SECURITY; -- Not needed!

-- Create indexes for performance
CREATE INDEX idx_public_submissions_status ON public_submissions(status);
CREATE INDEX idx_public_submissions_created_at ON public_submissions(created_at);
CREATE INDEX idx_public_submissions_restaurant ON public_submissions(restaurant_name);
CREATE INDEX idx_public_submissions_item_type ON public_submissions(item_type);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_submissions_updated_at 
    BEFORE UPDATE ON public_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment explaining the purpose
COMMENT ON TABLE public_submissions IS 'Public intake table for anonymous submissions - bypasses RLS completely';
COMMENT ON COLUMN public_submissions.status IS 'pending: waiting for admin review, approved: ready to process, rejected: declined, processed: moved to main tables';
COMMENT ON COLUMN public_submissions.processed_by IS 'UUID of admin user who processed the submission';

-- Grant appropriate permissions
GRANT ALL ON public_submissions TO authenticated;
GRANT INSERT, SELECT ON public_submissions TO anon;

-- Create function to easily move approved submissions to main tables
CREATE OR REPLACE FUNCTION process_public_submission(submission_id UUID, admin_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    submission_record public_submissions%ROWTYPE;
    new_client_id UUID;
    new_item_id UUID;
    result JSONB;
BEGIN
    -- Get the submission
    SELECT * INTO submission_record FROM public_submissions WHERE id = submission_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Submission not found or not approved');
    END IF;
    
    -- Create or get client
    SELECT client_id INTO new_client_id 
    FROM clients 
    WHERE restaurant_name = submission_record.restaurant_name 
    AND contact_name = submission_record.contact_name
    LIMIT 1;
    
    IF new_client_id IS NULL THEN
        -- Create new client
        INSERT INTO clients (restaurant_name, contact_name, contact_email, contact_phone)
        VALUES (submission_record.restaurant_name, submission_record.contact_name, 
                submission_record.contact_email, submission_record.contact_phone)
        RETURNING client_id INTO new_client_id;
    END IF;
    
    -- Insert into appropriate table
    IF submission_record.item_type = 'dish' THEN
        INSERT INTO dishes (client_id, name, description, notes, reference_image_urls)
        VALUES (new_client_id, submission_record.item_name, submission_record.description, 
                submission_record.special_notes, submission_record.original_image_urls)
        RETURNING id INTO new_item_id;
    ELSIF submission_record.item_type = 'cocktail' THEN
        INSERT INTO cocktails (client_id, name, description, notes, reference_image_urls)
        VALUES (new_client_id, submission_record.item_name, submission_record.description, 
                submission_record.special_notes, submission_record.original_image_urls)
        RETURNING id INTO new_item_id;
    ELSIF submission_record.item_type = 'drink' THEN
        INSERT INTO drinks (client_id, name, description, notes, reference_image_urls)
        VALUES (new_client_id, submission_record.item_name, submission_record.description, 
                submission_record.special_notes, submission_record.original_image_urls)
        RETURNING id INTO new_item_id;
    END IF;
    
    -- Create submission record
    INSERT INTO customer_submissions (
        client_id, original_item_id, item_type, item_name_at_submission,
        submission_status, original_image_urls, branding_material_urls, reference_example_urls,
        restaurant_name, contact_name, description
    ) VALUES (
        new_client_id, new_item_id, submission_record.item_type, submission_record.item_name,
        'ממתינה לעיבוד', submission_record.original_image_urls, submission_record.branding_material_urls,
        submission_record.reference_example_urls, submission_record.restaurant_name, 
        submission_record.contact_name, submission_record.description
    );
    
    -- Mark as processed
    UPDATE public_submissions 
    SET status = 'processed', processed_at = NOW(), processed_by = admin_user_id
    WHERE id = submission_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'client_id', new_client_id, 
        'item_id', new_item_id,
        'message', 'Submission processed successfully'
    );
END;
$$; 