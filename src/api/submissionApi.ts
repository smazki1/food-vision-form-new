
import { supabase } from "@/integrations/supabase/client";
import { FoodItem } from "@/types/food-vision";
import { Client } from "@/types/client";

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
  processed_image_urls: string[] | null;
  main_processed_image_url: string | null;
  edit_history: any | null;
  final_approval_timestamp: string | null;
  internal_team_notes: string | null;
  assigned_editor_id: string | null;
  clients?: { restaurant_name: string }; // Adding this property to match the actual data structure
};

// Get all submissions for a client
export async function getClientSubmissions(clientId: string): Promise<Submission[]> {
  const { data, error } = await supabase
    .from("customer_submissions")
    .select("*")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("Error fetching client submissions:", error);
    throw error;
  }

  return data as Submission[];
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
