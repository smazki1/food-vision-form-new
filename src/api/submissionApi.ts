import { supabase } from "@/integrations/supabase/client";
import { FoodItem } from "@/types/food-vision";
import { Client } from "@/types/client";
import { DishDetailsForTab, CocktailDetailsForTab, DrinkDetailsForTab } from "@/types/food-vision";

export type SubmissionStatus = 
  | "ממתינה לעיבוד" 
  | "בעיבוד" 
  | "מוכנה להצגה" 
  | "הערות התקבלו" 
  | "הושלמה ואושרה";

export type Submission = {
  submission_id: string;
  client_id: string;
  original_item_id: string;
  item_type: "dish" | "cocktail" | "drink";
  item_name_at_submission: string;
  assigned_package_id_at_submission?: string;
  submission_status: SubmissionStatus;
  uploaded_at: string;
  original_image_urls: string[] | null;
  processed_image_urls: string[] | null;
  main_processed_image_url: string | null;
  edit_history: any | null;
  edit_count: number | null;
  final_approval_timestamp: string | null;
  internal_team_notes: string | null;
  assigned_editor_id: string | null;
  target_completion_date: string | null;
  priority: string | null;
  created_lead_id?: string | null;
  lead_id?: string | null;
  created_at: string;
  // Related data
  clients?: { restaurant_name: string; contact_name: string; email: string; phone: string };
  leads?: { restaurant_name: string; contact_name: string; email: string; phone: string };
  submission_contact_name?: string | null;
  submission_contact_email?: string | null;
  submission_contact_phone?: string | null;
};

// Get all submissions for a client - fallback version with basic columns only
export async function getClientSubmissionsBasic(clientId: string): Promise<Submission[]> {
  console.log('[getClientSubmissionsBasic] Fetching basic submissions for client:', clientId);
  
  try {
    const { data, error } = await supabase
      .from("customer_submissions")
      .select(`
        submission_id,
        client_id,
        item_type,
        item_name_at_submission,
        submission_status,
        uploaded_at,
        original_image_urls,
        processed_image_urls,
        main_processed_image_url,
        edit_history,
        created_at
      `)
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching basic client submissions:", error);
      throw error;
    }

    console.log('[getClientSubmissionsBasic] Successfully fetched', data?.length || 0, 'basic submissions');
    
    // Fill in missing fields with defaults
    const submissions = data.map((item: any) => ({
      submission_id: item.submission_id,
      client_id: item.client_id,
      original_item_id: '', // Default empty
      item_type: item.item_type,
      item_name_at_submission: item.item_name_at_submission,
      assigned_package_id_at_submission: undefined,
      submission_status: item.submission_status,
      uploaded_at: item.uploaded_at,
      original_image_urls: item.original_image_urls,
      processed_image_urls: item.processed_image_urls,
      main_processed_image_url: item.main_processed_image_url,
      edit_history: item.edit_history,
      edit_count: 0,
      final_approval_timestamp: null,
      internal_team_notes: null,
      assigned_editor_id: null,
      target_completion_date: null,
      priority: null,
      created_lead_id: null,
      lead_id: null,
      created_at: item.created_at,
      submission_contact_name: null,
      submission_contact_email: null,
      submission_contact_phone: null
    }));
    
    return submissions as Submission[];
  } catch (error) {
    console.error('[getClientSubmissionsBasic] Exception:', error);
    throw error;
  }
}

// Get all submissions for a client
export async function getClientSubmissions(clientId: string): Promise<Submission[]> {
  console.log('[getClientSubmissions] Fetching submissions for client:', clientId);
  
  try {
    // Try the full version first, fallback to basic if it fails
    const { data, error } = await supabase
      .from("customer_submissions")
      .select("*")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching client submissions, trying basic version:", error);
      // Fallback to basic version
      return await getClientSubmissionsBasic(clientId);
    }

    console.log('[getClientSubmissions] Successfully fetched', data?.length || 0, 'submissions');
    return data as Submission[];
  } catch (error) {
    console.error('[getClientSubmissions] Exception, trying basic version:', error);
    // Fallback to basic version
    try {
      return await getClientSubmissionsBasic(clientId);
    } catch (fallbackError) {
      console.error('[getClientSubmissions] Both versions failed:', fallbackError);
      throw fallbackError;
    }
  }
}

// Create a new submission for a dish, cocktail, or drink
export async function createSubmission(
  clientId: string,
  originalItemId: string,
  itemType: "dish" | "cocktail" | "drink",
  itemName: string,
  packageId?: string
): Promise<Submission> {
  const { data, error } = await supabase
    .from("customer_submissions")
    .insert({
      client_id: clientId,
      original_item_id: originalItemId,
      item_type: itemType,
      item_name_at_submission: itemName,
      assigned_package_id_at_submission: packageId
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating submission:", error);
    throw error;
  }

  return data as Submission;
}

// Create batch submissions for multiple items
export async function createBatchSubmissions(
  clientId: string,
  items: Array<{
    originalItemId: string;
    itemType: "dish" | "cocktail" | "drink";
    itemName: string;
  }>,
  packageId?: string
): Promise<void> {
  const submissionRecords = items.map(item => ({
    client_id: clientId,
    original_item_id: item.originalItemId,
    item_type: item.itemType,
    item_name_at_submission: item.itemName,
    assigned_package_id_at_submission: packageId
  }));

  const { error } = await supabase
    .from("customer_submissions")
    .insert(submissionRecords);

  if (error) {
    console.error("Error creating batch submissions:", error);
    throw error;
  }
}

// Get remaining servings for a client
export async function getClientRemainingServings(clientId: string): Promise<number> {
  const { data, error } = await supabase
    .from("clients")
    .select("remaining_servings")
    .eq("client_id", clientId)
    .single();

  if (error) {
    console.error("Error fetching client remaining servings:", error);
    throw error;
  }

  return data.remaining_servings;
}

export async function getUniqueSubmittedDishDetailsForClient(clientId: string): Promise<DishDetailsForTab[]> {
  // 1. Get all submissions for the client
  const submissions = await getClientSubmissions(clientId);

  // 2. Filter for dish submissions and get unique dish IDs, excluding empty/null values
  const dishIds = [
    ...new Set(
      submissions
        .filter(sub => sub.item_type === 'dish' && sub.original_item_id && sub.original_item_id.trim() !== '')
        .map(sub => sub.original_item_id)
    ),
  ];

  if (dishIds.length === 0) {
    return [];
  }

  // 3. Fetch details for these unique dishes
  // Make sure the select query matches the fields in DishDetailsForTab
  const { data: dishesData, error: dishesError } = await supabase
    .from('dishes') // Assuming 'dishes' is your dishes table name
    .select('dish_id, name, ingredients, description, notes, reference_image_urls')
    .in('dish_id', dishIds);

  if (dishesError) {
    console.error("Error fetching unique submitted dish details:", dishesError);
    throw dishesError;
  }

  return (dishesData || []) as DishDetailsForTab[];
}

export async function getUniqueSubmittedCocktailDetailsForClient(clientId: string): Promise<CocktailDetailsForTab[]> {
  // 1. Get all submissions for the client
  const submissions = await getClientSubmissions(clientId);

  // 2. Filter for cocktail submissions and get unique cocktail IDs, excluding empty/null values
  const cocktailIds = [
    ...new Set(
      submissions
        .filter(sub => sub.item_type === 'cocktail' && sub.original_item_id && sub.original_item_id.trim() !== '')
        .map(sub => sub.original_item_id)
    ),
  ];

  if (cocktailIds.length === 0) {
    return [];
  }

  // 3. Fetch details for these unique cocktails
  // Assuming 'cocktails' is your cocktails table name
  const { data: cocktailsData, error: cocktailsError } = await supabase
    .from('cocktails') 
    .select('cocktail_id, name, ingredients, description, notes, reference_image_urls')
    .in('cocktail_id', cocktailIds);

  if (cocktailsError) {
    console.error("Error fetching unique submitted cocktail details:", cocktailsError);
    throw cocktailsError;
  }

  return (cocktailsData || []) as CocktailDetailsForTab[];
}

export async function getUniqueSubmittedDrinkDetailsForClient(clientId: string): Promise<DrinkDetailsForTab[]> {
  // 1. Get all submissions for the client
  const submissions = await getClientSubmissions(clientId);

  // 2. Filter for drink submissions and get unique drink IDs, excluding empty/null values
  const drinkIds = [
    ...new Set(
      submissions
        .filter(sub => sub.item_type === 'drink' && sub.original_item_id && sub.original_item_id.trim() !== '')
        .map(sub => sub.original_item_id)
    ),
  ];

  if (drinkIds.length === 0) {
    return [];
  }

  // 3. Fetch details for these unique drinks
  // Assuming 'drinks' is your drinks table name
  const { data: drinksData, error: drinksError } = await supabase
    .from('drinks') 
    .select('drink_id, name, ingredients, description, notes, reference_image_urls') // Ensure fields match DrinkDetailsForTab
    .in('drink_id', drinkIds);

  if (drinksError) {
    console.error("Error fetching unique submitted drink details:", drinksError);
    throw drinksError;
  }

  return (drinksData || []) as DrinkDetailsForTab[];
}
