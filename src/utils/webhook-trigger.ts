
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { getOrCreateClient } from "./client-utils";
import { processDishItems, processCocktailItems, processDrinkItems } from "./item-utils";
import { processAdditionalDetails } from "./additional-details-utils";
import { prepareWebhookPayload, triggerWebhooks } from "./webhook-utils";
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
    const dishIds = await processDishItems(
      Array.isArray(formData.dishes) ? formData.dishes : [], 
      client_id
    );
    
    const cocktailIds = await processCocktailItems(
      Array.isArray(formData.cocktails) ? formData.cocktails : [], 
      client_id
    );
    
    const drinkIds = await processDrinkItems(
      Array.isArray(formData.drinks) ? formData.drinks : [], 
      client_id
    );

    // Process additional details
    const brandingMaterialsUrl = formData.additionalDetails.brandingMaterials 
      ? await uploadFileToStorage(formData.additionalDetails.brandingMaterials) 
      : null;
      
    await processAdditionalDetails(formData.additionalDetails, client_id);

    // Prepare webhook payload
    const webhookPayload = prepareWebhookPayload(
      formData.clientDetails,
      client_id,
      Array.isArray(formData.dishes) ? formData.dishes : [],
      dishIds,
      Array.isArray(formData.cocktails) ? formData.cocktails : [],
      cocktailIds,
      Array.isArray(formData.drinks) ? formData.drinks : [],
      drinkIds,
      formData.additionalDetails,
      brandingMaterialsUrl
    );

    // Trigger the webhooks
    const webhookResult = await triggerWebhooks(webhookPayload);
    
    if (webhookResult) {
      toast.success('Form submitted successfully');
      return true;
    } else {
      toast.error('Error submitting form. Please try again.');
      return false;
    }
  } catch (error) {
    console.error('Error processing form submission:', error);
    toast.error('Error submitting form. Please try again.');
    throw error;
  }
};
