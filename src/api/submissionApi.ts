
import { supabase } from "@/integrations/supabase/client";

export interface DishDetailsForTab {
  id: string;
  name: string;
  description: string;
  notes?: string;
  reference_image_urls?: string[];
}

export interface CocktailDetailsForTab {
  id: string;
  name: string;
  description: string;
  notes?: string;
  reference_image_urls?: string[];
}

export interface DrinkDetailsForTab {
  id: string;
  name: string;
  description: string;
  notes?: string;
  reference_image_urls?: string[];
}

export type SubmissionStatus = 
  | "ממתינה לעיבוד" 
  | "בעיבוד" 
  | "מוכנה להצגה" 
  | "הערות התקבלו" 
  | "הושלמה ואושרה";

export interface Submission {
  submission_id: string;
  client_id: string;
  original_item_id: string;
  item_type: string;
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
  priority: string | null;
  created_lead_id?: string | null;
  lead_id?: string | null;
  created_at: string;
  branding_material_urls?: string[] | null;
  reference_example_urls?: string[] | null;
  description?: string | null;
  restaurant_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  processed_at?: string | null;
  clients?: { restaurant_name: string; contact_name: string; email: string; phone: string };
  leads?: { restaurant_name: string; contact_name: string; email: string; phone: string };
  submission_contact_name?: string | null;
  submission_contact_email?: string | null;
  submission_contact_phone?: string | null;
}

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
    
    const submissions = data.map((item: any) => ({
      submission_id: item.submission_id,
      client_id: item.client_id,
      original_item_id: '',
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

export async function getClientSubmissions(clientId: string): Promise<Submission[]> {
  console.log('[getClientSubmissions] Fetching submissions for client:', clientId);
  
  try {
    const { data, error } = await supabase
      .from("customer_submissions")
      .select("*")
      .eq("client_id", clientId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      console.error("Error fetching client submissions, trying basic version:", error);
      return await getClientSubmissionsBasic(clientId);
    }

    console.log('[getClientSubmissions] Successfully fetched', data?.length || 0, 'submissions');
    return data.map((item: any) => ({
      ...item,
      edit_count: item.edit_count || 0,
      internal_team_notes: item.internal_team_notes || null,
      priority: item.priority || null,
      created_at: item.created_at || item.uploaded_at,
      final_approval_timestamp: item.final_approval_timestamp || null,
      assigned_editor_id: item.assigned_editor_id || null,
      created_lead_id: item.created_lead_id || null,
      lead_id: item.lead_id || null,
      submission_contact_name: item.submission_contact_name || null,
      submission_contact_email: item.submission_contact_email || null,
      submission_contact_phone: item.submission_contact_phone || null
    })) as Submission[];
  } catch (error) {
    console.error('[getClientSubmissions] Exception, trying basic version:', error);
    try {
      return await getClientSubmissionsBasic(clientId);
    } catch (fallbackError) {
      console.error('[getClientSubmissions] Both versions failed:', fallbackError);
      throw fallbackError;
    }
  }
}

export async function createSubmission(
  clientId: string,
  originalItemId: string,
  itemType: string,
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

export async function getUniqueSubmittedDishDetailsForClient(clientId: string): Promise<DishDetailsForTab[]> {
  const submissions = await getClientSubmissions(clientId);
  
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

  const { data: dishesData, error: dishesError } = await supabase
    .from('dishes')
    .select('id, name, description, notes, reference_image_urls')
    .in('id', dishIds);

  if (dishesError) {
    console.error("Error fetching unique submitted dish details:", dishesError);
    throw dishesError;
  }

  return (dishesData || []).map(dish => ({
    id: dish.id,
    name: dish.name,
    description: dish.description,
    notes: dish.notes,
    reference_image_urls: dish.reference_image_urls
  })) as DishDetailsForTab[];
}

export async function getUniqueSubmittedCocktailDetailsForClient(clientId: string): Promise<CocktailDetailsForTab[]> {
  const submissions = await getClientSubmissions(clientId);
  
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

  const { data: cocktailsData, error: cocktailsError } = await supabase
    .from('cocktails') 
    .select('id, name, description, notes, reference_image_urls')
    .in('id', cocktailIds);

  if (cocktailsError) {
    console.error("Error fetching unique submitted cocktail details:", cocktailsError);
    throw cocktailsError;
  }

  return (cocktailsData || []).map(cocktail => ({
    id: cocktail.id,
    name: cocktail.name,
    description: cocktail.description,
    notes: cocktail.notes,
    reference_image_urls: cocktail.reference_image_urls
  })) as CocktailDetailsForTab[];
}

export async function getUniqueSubmittedDrinkDetailsForClient(clientId: string): Promise<DrinkDetailsForTab[]> {
  const submissions = await getClientSubmissions(clientId);
  
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

  const { data: drinksData, error: drinksError } = await supabase
    .from('drinks') 
    .select('id, name, description, notes, reference_image_urls')
    .in('id', drinkIds);

  if (drinksError) {
    console.error("Error fetching unique submitted drink details:", drinksError);
    throw drinksError;
  }

  return (drinksData || []).map(drink => ({
    id: drink.id,
    name: drink.name,
    description: drink.description,
    notes: drink.notes,
    reference_image_urls: drink.reference_image_urls
  })) as DrinkDetailsForTab[];
}

export async function getClientRemainingServings(clientId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('remaining_servings')
      .eq('client_id', clientId)
      .single();

    if (error) {
      console.error("Error fetching client remaining servings:", error);
      throw error;
    }

    return data?.remaining_servings || 0;
  } catch (error) {
    console.error("Exception in getClientRemainingServings:", error);
    throw error;
  }
}

export async function createBatchSubmissions(
  clientId: string, 
  items: Array<{ originalItemId: string; itemType: "dish" | "cocktail" | "drink"; itemName: string }>
): Promise<void> {
  try {
    const submissions = items.map(item => ({
      client_id: clientId,
      original_item_id: item.originalItemId,
      item_type: item.itemType,
      item_name_at_submission: item.itemName,
      submission_status: 'ממתינה לעיבוד' as SubmissionStatus,
      uploaded_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('customer_submissions')
      .insert(submissions);

    if (error) {
      console.error("Error creating batch submissions:", error);
      throw error;
    }

    console.log(`Successfully created ${submissions.length} batch submissions for client ${clientId}`);
  } catch (error) {
    console.error("Exception in createBatchSubmissions:", error);
    throw error;
  }
}
