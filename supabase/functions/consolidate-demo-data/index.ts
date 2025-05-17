
// Follow Deno runtime API
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.29.0';

// Set up CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Creates a Supabase client with the Admin key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Handle CORS preflight requests
async function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Main serve function
serve(async (req: Request) => {
  // Handle CORS
  const corsResponse = await handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log('Starting data consolidation process...');
    
    // Step 1: Get test package ID
    console.log('Getting test package ID...');
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('service_packages')
      .select('package_id, total_servings')
      .eq('package_name', 'חבילת טסט של לקוח ראשון')
      .single();
    
    if (packageError) throw new Error(`Error fetching test package: ${packageError.message}`);
    if (!packageData) throw new Error('Test package not found');
    
    const testPackageId = packageData.package_id;
    const totalServings = packageData.total_servings;
    console.log(`Found test package with ID: ${testPackageId}`);
    
    // Step 2: Create or get auth user for balanga@demo.com
    console.log('Creating or getting auth user...');
    let authUserId: string;
    
    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    if (userError) throw new Error(`Error listing users: ${userError.message}`);
    
    const existingUser = userData.users.find((user) => user.email === 'balanga@demo.com');
    
    if (existingUser) {
      console.log(`Found existing user with ID: ${existingUser.id}`);
      authUserId = existingUser.id;
      
      // Make sure email is confirmed
      if (!existingUser.email_confirmed_at) {
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          email_confirm: true
        });
        console.log('Updated user to confirm email');
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: 'balanga@demo.com',
        password: 'Demo123!',
        email_confirm: true
      });
      
      if (createError) throw new Error(`Error creating user: ${createError.message}`);
      authUserId = newUser.user.id;
      console.log(`Created new user with ID: ${authUserId}`);
    }
    
    // Step 3: Get or create master client record
    console.log('Getting or creating master client record...');
    let masterClientId: string;
    
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('client_id')
      .eq('email', 'balanga@demo.com')
      .maybeSingle();
      
    if (clientError) throw new Error(`Error fetching client: ${clientError.message}`);
    
    if (clientData) {
      masterClientId = clientData.client_id;
      console.log(`Found existing client with ID: ${masterClientId}`);
      
      // Update client record with auth user ID and package
      const { error: updateError } = await supabaseAdmin
        .from('clients')
        .update({
          user_auth_id: authUserId,
          current_package_id: testPackageId,
          restaurant_name: 'חוף בלנגה - דמו',
          contact_name: 'נועה דמו',
          client_status: 'פעיל'
        })
        .eq('client_id', masterClientId);
        
      if (updateError) throw new Error(`Error updating client: ${updateError.message}`);
      console.log('Updated client record');
    } else {
      // Create new client record
      const { data: newClient, error: createClientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_auth_id: authUserId,
          current_package_id: testPackageId,
          restaurant_name: 'חוף בלנגה - דמו',
          contact_name: 'נועה דמו',
          email: 'balanga@demo.com',
          phone: '050-1234567',
          client_status: 'פעיל',
          remaining_servings: totalServings
        })
        .select()
        .single();
        
      if (createClientError) throw new Error(`Error creating client: ${createClientError.message}`);
      masterClientId = newClient.client_id;
      console.log(`Created new client with ID: ${masterClientId}`);
    }
    
    // Step 4: Consolidate dishes
    console.log('Consolidating dishes...');
    const { data: dishes, error: dishesError } = await supabaseAdmin
      .from('dishes')
      .select('dish_id, name, created_at');
      
    if (dishesError) throw new Error(`Error fetching dishes: ${dishesError.message}`);
    console.log(`Found ${dishes.length} dishes to consolidate`);
    
    // Update dishes to belong to master client
    if (dishes.length > 0) {
      const { error: updateDishesError } = await supabaseAdmin
        .from('dishes')
        .update({ client_id: masterClientId })
        .in('dish_id', dishes.map(dish => dish.dish_id));
        
      if (updateDishesError) throw new Error(`Error updating dishes: ${updateDishesError.message}`);
      console.log('Updated all dishes to belong to master client');
    }
    
    // Step 5: Consolidate cocktails
    console.log('Consolidating cocktails...');
    const { data: cocktails, error: cocktailsError } = await supabaseAdmin
      .from('cocktails')
      .select('cocktail_id, name, created_at');
      
    if (cocktailsError) throw new Error(`Error fetching cocktails: ${cocktailsError.message}`);
    console.log(`Found ${cocktails.length} cocktails to consolidate`);
    
    // Update cocktails to belong to master client
    if (cocktails.length > 0) {
      const { error: updateCocktailsError } = await supabaseAdmin
        .from('cocktails')
        .update({ client_id: masterClientId })
        .in('cocktail_id', cocktails.map(cocktail => cocktail.cocktail_id));
        
      if (updateCocktailsError) throw new Error(`Error updating cocktails: ${updateCocktailsError.message}`);
      console.log('Updated all cocktails to belong to master client');
    }
    
    // Step 6: Consolidate drinks
    console.log('Consolidating drinks...');
    const { data: drinks, error: drinksError } = await supabaseAdmin
      .from('drinks')
      .select('drink_id, name, created_at');
      
    if (drinksError) throw new Error(`Error fetching drinks: ${drinksError.message}`);
    console.log(`Found ${drinks.length} drinks to consolidate`);
    
    // Update drinks to belong to master client
    if (drinks.length > 0) {
      const { error: updateDrinksError } = await supabaseAdmin
        .from('drinks')
        .update({ client_id: masterClientId })
        .in('drink_id', drinks.map(drink => drink.drink_id));
        
      if (updateDrinksError) throw new Error(`Error updating drinks: ${updateDrinksError.message}`);
      console.log('Updated all drinks to belong to master client');
    }
    
    // Step 7: Create/update customer_submissions for dishes
    console.log('Creating submissions for dishes...');
    let totalSubmissions = 0;
    
    for (const dish of dishes) {
      // Check if a submission already exists for this dish
      const { data: existingSubmission, error: submissionError } = await supabaseAdmin
        .from('customer_submissions')
        .select('submission_id')
        .eq('client_id', masterClientId)
        .eq('original_item_id', dish.dish_id)
        .eq('item_type', 'dish')
        .maybeSingle();
        
      if (submissionError) throw new Error(`Error checking for existing submission: ${submissionError.message}`);
      
      if (!existingSubmission) {
        // Create a new submission
        const { error: createSubmissionError } = await supabaseAdmin
          .from('customer_submissions')
          .insert({
            client_id: masterClientId,
            original_item_id: dish.dish_id,
            item_type: 'dish',
            item_name_at_submission: dish.name,
            submission_status: 'הושלמה ואושרה', // Completed and approved
            assigned_package_id_at_submission: testPackageId,
            uploaded_at: dish.created_at,
            final_approval_timestamp: new Date().toISOString()
          });
          
        if (createSubmissionError) throw new Error(`Error creating dish submission: ${createSubmissionError.message}`);
        totalSubmissions++;
      }
    }
    
    // Step 8: Create/update customer_submissions for cocktails
    console.log('Creating submissions for cocktails...');
    
    for (const cocktail of cocktails) {
      // Check if a submission already exists for this cocktail
      const { data: existingSubmission, error: submissionError } = await supabaseAdmin
        .from('customer_submissions')
        .select('submission_id')
        .eq('client_id', masterClientId)
        .eq('original_item_id', cocktail.cocktail_id)
        .eq('item_type', 'cocktail')
        .maybeSingle();
        
      if (submissionError) throw new Error(`Error checking for existing submission: ${submissionError.message}`);
      
      if (!existingSubmission) {
        // Create a new submission
        const { error: createSubmissionError } = await supabaseAdmin
          .from('customer_submissions')
          .insert({
            client_id: masterClientId,
            original_item_id: cocktail.cocktail_id,
            item_type: 'cocktail',
            item_name_at_submission: cocktail.name,
            submission_status: 'הושלמה ואושרה', // Completed and approved
            assigned_package_id_at_submission: testPackageId,
            uploaded_at: cocktail.created_at,
            final_approval_timestamp: new Date().toISOString()
          });
          
        if (createSubmissionError) throw new Error(`Error creating cocktail submission: ${createSubmissionError.message}`);
        totalSubmissions++;
      }
    }
    
    // Step 9: Create/update customer_submissions for drinks
    console.log('Creating submissions for drinks...');
    
    for (const drink of drinks) {
      // Check if a submission already exists for this drink
      const { data: existingSubmission, error: submissionError } = await supabaseAdmin
        .from('customer_submissions')
        .select('submission_id')
        .eq('client_id', masterClientId)
        .eq('original_item_id', drink.drink_id)
        .eq('item_type', 'drink')
        .maybeSingle();
        
      if (submissionError) throw new Error(`Error checking for existing submission: ${submissionError.message}`);
      
      if (!existingSubmission) {
        // Create a new submission
        const { error: createSubmissionError } = await supabaseAdmin
          .from('customer_submissions')
          .insert({
            client_id: masterClientId,
            original_item_id: drink.drink_id,
            item_type: 'drink',
            item_name_at_submission: drink.name,
            submission_status: 'הושלמה ואושרה', // Completed and approved
            assigned_package_id_at_submission: testPackageId,
            uploaded_at: drink.created_at,
            final_approval_timestamp: new Date().toISOString()
          });
          
        if (createSubmissionError) throw new Error(`Error creating drink submission: ${createSubmissionError.message}`);
        totalSubmissions++;
      }
    }
    
    // Step 10: Count all submissions for this client
    console.log('Counting all submissions...');
    const { count, error: countError } = await supabaseAdmin
      .from('customer_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', masterClientId);
      
    if (countError) throw new Error(`Error counting submissions: ${countError.message}`);
    
    const submissionCount = count || 0;
    console.log(`Total submissions for client: ${submissionCount}`);
    
    // Step 11: Update remaining servings
    const remainingServings = Math.max(0, totalServings - submissionCount);
    console.log(`Updating remaining servings to ${remainingServings}...`);
    
    const { error: updateServingsError } = await supabaseAdmin
      .from('clients')
      .update({ remaining_servings: remainingServings })
      .eq('client_id', masterClientId);
      
    if (updateServingsError) throw new Error(`Error updating remaining servings: ${updateServingsError.message}`);
    
    console.log('Data consolidation completed successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data consolidation completed successfully',
        details: {
          masterClientId,
          authUserId,
          testPackageId,
          totalItems: dishes.length + cocktails.length + drinks.length,
          totalSubmissions: submissionCount,
          remainingServings
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in consolidation process:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
