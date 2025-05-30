import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

// Note: Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your Edge Function environment variables.
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? 'YOUR_SUPABASE_URL'; // Fallback, but should be set in env
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'YOUR_SERVICE_ROLE_KEY'; // Fallback, MUST be set in env

// Configuration (Ideally, also from environment variables)
const SUBMISSIONS_TABLE_NAME = 'submissions'; // ASSUMPTION
const STORAGE_BUCKET_NAME = 'food-vision-images'; // UPDATED based on user screenshot

console.log('Starting `process-public-submission` Edge Function (v5 - Using food-vision-images bucket)');

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let supabaseAdmin: SupabaseClient;
  try {
    // Initialize Supabase client with the service role key for admin operations
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  } catch (e: unknown) {
    let errorMessage = 'Server configuration error.';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    console.error('Failed to initialize Supabase client:', errorMessage);
    return new Response(JSON.stringify({ error: 'Server configuration error.', detail: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }

  try {
    const formData = await req.formData();
    const businessName = formData.get('businessName') as string;
    const itemName = formData.get('itemName') as string;
    const itemType = formData.get('itemType') as 'dish' | 'cocktail' | 'drink';
    const description = formData.get('description') as string;
    const specialNotes = formData.get('specialNotes') as string | null;

    // --- 1. Validate input ---
    if (!businessName || !itemName || !itemType || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields: businessName, itemName, itemType, description are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
    
    const imageFiles: File[] = [];
    for (const value of formData.values()) {
      if (value instanceof File && value.size > 0) {
        if (imageFiles.length < 10) { 
            imageFiles.push(value);
        }
      }
    }

    if (imageFiles.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one image is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Processing submission for business: ${businessName}, item: ${itemName}`);

    // --- 2. Upload images to Supabase Storage ---
    const uploadedImageUrls: string[] = [];
    for (const file of imageFiles) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `public/${crypto.randomUUID()}-${cleanFileName}`;

      const { data: _uploadData, error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET_NAME)
        .upload(filePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        console.error(`Error uploading file ${file.name}:`, uploadError.message);
        throw new Error(`Failed to upload file: ${file.name}. ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET_NAME)
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
          console.warn(`Could not get public URL for uploaded file: ${filePath}`);
          throw new Error(`Failed to get public URL for uploaded file: ${filePath}`);
      }
      uploadedImageUrls.push(publicUrlData.publicUrl);
    }
    console.log('Successfully uploaded image URLs:', uploadedImageUrls);

    // --- 3. Insert data into Supabase table ---
    const submissionRecord = {
      business_name: businessName,
      item_name: itemName,
      item_type: itemType,
      description: description,
      special_notes: specialNotes,
      image_urls: uploadedImageUrls,
      status: 'pending',
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from(SUBMISSIONS_TABLE_NAME)
      .insert([submissionRecord])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting submission to database:', insertError.message);
      throw new Error(`Failed to save submission to database: ${insertError.message}`);
    }
    console.log('Successfully inserted submission, ID:', insertData?.id);

    return new Response(JSON.stringify({ 
      message: 'Submission processed successfully!',
      submissionId: insertData?.id,
      data: insertData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    let errorMessage = 'Internal server error during submission processing.';
    let errorStack = undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }
    console.error('Critical error in process-public-submission:', errorMessage, errorStack);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 