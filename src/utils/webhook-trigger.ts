import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { getOrCreateClient } from "./client-utils";
import { processDishItems, processCocktailItems, processDrinkItems } from "./item-utils";
import { processAdditionalDetails } from "./additional-details-utils";
// import { prepareWebhookPayload, triggerWebhooks } from "./webhook-utils"; // MODIFIED: Commented out
import { uploadFileToStorage } from "./storage-utils";

interface FormData {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
}

export const triggerMakeWebhook = async (formData: FormData): Promise<boolean> => {
  try {
    // Get or create client
    const client_id = await getOrCreateClient(formData.clientDetails);
    
    // Process dishes, cocktails, and drinks
    // These functions likely save data to your Supabase tables
    await processDishItems(
      Array.isArray(formData.dishes) ? formData.dishes : [], 
      client_id
    );
    
    await processCocktailItems(
      Array.isArray(formData.cocktails) ? formData.cocktails : [], 
      client_id
    );
    
    await processDrinkItems(
      Array.isArray(formData.drinks) ? formData.drinks : [], 
      client_id
    );

    // Process additional details (including file upload if present)
    // This also likely saves data to your Supabase tables
    if (formData.additionalDetails.brandingMaterials) {
      // Assuming uploadFileToStorage is still needed if brandingMaterials exist
      /* const brandingMaterialsUrl = */ await uploadFileToStorage(formData.additionalDetails.brandingMaterials);
      // The URL might be stored by uploadFileToStorage or on the additionalDetails object itself if modified by uploadFileToStorage.
      // processAdditionalDetails will use the state of additionalDetails as it is after any such modification.
      await processAdditionalDetails(formData.additionalDetails, client_id);
    } else {
      await processAdditionalDetails(formData.additionalDetails, client_id);
    }
    
    // Webhook logic is removed. We now assume success at this stage
    // if all previous database operations were successful.
    // toast.success('Form submitted successfully'); // This toast is handled by useFoodVisionSubmit
    return true;

  } catch (error) {
    console.error('Error processing form submission (database operations):', error);
    // toast.error('Error submitting form. Please try again.'); // This toast is handled by useFoodVisionSubmit
    throw error; // Re-throw the error so the calling function can handle it
  }
};
