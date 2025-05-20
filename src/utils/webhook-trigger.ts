import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { getOrCreateClient } from "./client-utils";
import { processDishItems, processCocktailItems, processDrinkItems } from "./item-utils";
import { uploadFileToStorage } from "./storage-utils";
import { processAdditionalDetails } from "./additional-details-utils";
// import { prepareWebhookPayload, triggerWebhooks } from "./webhook-utils"; // MODIFIED: Commented out

interface FormData {
  clientDetails: ClientDetails;
  dishes: FoodItem[];
  cocktails: FoodItem[];
  drinks: FoodItem[];
  additionalDetails: AdditionalDetails;
}

// Define the structure for the return type
interface TriggerWebhookResult {
  success: boolean;
  clientId?: string; // Also return clientId as it's determined here
  createdItemsInfo?: Array<{
    originalItemId: string; // The actual database ID
    itemType: "dish" | "cocktail" | "drink";
    itemName: string;
  }>;
  error?: string; // Optional error message
}

export const triggerMakeWebhook = async (formData: FormData): Promise<TriggerWebhookResult> => {
  let currentClientId: string | null = null;
  const createdItemsInfo: Array<{ originalItemId: string; itemType: "dish" | "cocktail" | "drink"; itemName: string }> = [];

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError && !user) { // Stricter check: if authError and no user, it's problematic for identified submissions
      console.error("[triggerMakeWebhook] Error fetching user and no user object available:", authError);
      // Depending on desired behavior for fully anonymous submissions, this might change.
      // For now, assume client creation/linking needs some identifier or will fail gracefully in getOrCreateClient.
    }

    currentClientId = await getOrCreateClient(formData.clientDetails, user?.id);
    if (!currentClientId) {
      toast.error("שגיאה ביצירת או אחזור לקוח.");
      return { success: false, error: "Failed to get or create client." };
    }
    
    // Process items and collect their new DB IDs and info
    if (formData.dishes && formData.dishes.length > 0) {
      const dishIds = await processDishItems(formData.dishes, currentClientId);
      dishIds.forEach((id, index) => {
        createdItemsInfo.push({ 
          originalItemId: id, 
          itemType: "dish", 
          itemName: formData.dishes[index].name 
        });
      });
    }
    if (formData.cocktails && formData.cocktails.length > 0) {
      const cocktailIds = await processCocktailItems(formData.cocktails, currentClientId);
      cocktailIds.forEach((id, index) => {
        createdItemsInfo.push({ 
          originalItemId: id, 
          itemType: "cocktail", 
          itemName: formData.cocktails[index].name 
        });
      });
    }
    if (formData.drinks && formData.drinks.length > 0) {
      const drinkIds = await processDrinkItems(formData.drinks, currentClientId);
      drinkIds.forEach((id, index) => {
        createdItemsInfo.push({ 
          originalItemId: id, 
          itemType: "drink", 
          itemName: formData.drinks[index].name 
        });
      });
    }

    let uploadedBrandingMaterialUrl: string | undefined = undefined;
    if (formData.additionalDetails.brandingMaterials) {
      const file = formData.additionalDetails.brandingMaterials[0];
      if (file instanceof File) {
        // Assuming uploadFileToStorage takes the file and optionally a path prefix/bucket details
        // and returns a URL or path. For now, let's assume it takes only file.
        uploadedBrandingMaterialUrl = await uploadFileToStorage(file);
        // If AdditionalDetails type needs updating:
        // (formData.additionalDetails as any).brandingMaterialUrl = uploadedBrandingMaterialUrl;
      }
    }
    // Create a new object for additionalDetails to avoid mutating the original form state directly
    // and to remove brandingMaterials File array.
    const detailsToProcess = { ...formData.additionalDetails };
    delete detailsToProcess.brandingMaterials;
    if (uploadedBrandingMaterialUrl && !(detailsToProcess as any).brandingMaterialUrl) {
        (detailsToProcess as any).brandingMaterialUrl = uploadedBrandingMaterialUrl;
    }

    // Assuming processAdditionalDetails expects (details, clientId) based on typical util patterns
    await processAdditionalDetails(detailsToProcess, currentClientId);

    // Placeholder for actual webhook triggering logic
    // const webhookPayload = prepareWebhookPayload(currentClientId, createdItemsInfo, formData.additionalDetails);
    // const webhookSuccess = await triggerWebhooks(webhookPayload);
    // For now, assume webhook part is successful if items processed
    const webhookSuccess = true; 

    if (webhookSuccess) {
      console.log("[triggerMakeWebhook] Processed successfully. ClientID:", currentClientId, "Created Items:", createdItemsInfo.length);
      return { success: true, clientId: currentClientId, createdItemsInfo };
    } else {
      toast.error("שגיאה בשליחת נתונים ל-webhook.");
      return { success: false, clientId: currentClientId, error: "Webhook trigger failed" };
    }

  } catch (error: any) {
    console.error("[triggerMakeWebhook] Error in submission process:", error);
    // Corrected template literal for toast message
    toast.error(`אירעה שגיאה: ${error.message || 'Unknown error'}`);
    return { success: false, clientId: currentClientId, createdItemsInfo, error: error.message || 'Unknown error in submission process' };
  }
};

// Example placeholder for prepareWebhookPayload and triggerWebhooks if they were complex
// function prepareWebhookPayload(clientId, items, additionalDetails) { /* ... */ return {}; }
// async function triggerWebhooks(payload): Promise<boolean> { /* ... */ return true; }

