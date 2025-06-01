import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { createBatchSubmissions, getClientRemainingServings } from "@/api/submissionApi";
import { processDishItems, processCocktailItems, processDrinkItems } from "@/utils/item-utils";
import { uploadFileToStorage } from "@/utils/storage-utils";
import { processAdditionalDetails } from "@/utils/additional-details-utils";

export const useFoodVisionSubmit = ({
  clientDetails,
  dishes,
  cocktails,
  drinks,
  additionalDetails,
  setActiveTab,
  setClientDetails,
  setDishes,
  setCocktails,
  setDrinks,
  setAdditionalDetails,
  setIsSubmitting,
}: any) => {
  return useCallback(async (options?: { clientId?: string }) => {
    const currentClientId = options?.clientId;

    if (!clientDetails.restaurantName ||
        !clientDetails.contactName ||
        !clientDetails.phoneNumber ||
        !clientDetails.email) {
      toast.error("אנא מלאו את כל שדות החובה בפרטי המסעדה.");
      setActiveTab("client");
      return { success: false, message: "חסרים שדות חובה בפרטי המסעדה" };
    }

    const totalNewItems =
      (Array.isArray(dishes) ? dishes.length : 0) +
      (Array.isArray(cocktails) ? cocktails.length : 0) +
      (Array.isArray(drinks) ? drinks.length : 0);

    if (totalNewItems === 0 && !additionalDetails.visualStyle && !additionalDetails.brandColors && !additionalDetails.generalNotes && !(additionalDetails.brandingMaterials && additionalDetails.brandingMaterials.length > 0)) {
      toast.info("אנא הוסיפו לפחות פריט אחד או פרטים נוספים לשליחה.");
      return { success: false, message: "אין פריטים או פרטים נוספים לשליחה" };
    }

    setIsSubmitting(true);

    try {
      if (currentClientId) {
        // --- FLOW FOR AUTHENTICATED CLIENT (currentClientId is from 'clients' table) ---
        let remainingServings = 0;
        try {
          remainingServings = await getClientRemainingServings(currentClientId);
          if (remainingServings < totalNewItems) {
            toast.error(`אין מספיק מנות בחבילה. נותרו ${remainingServings} מנות, אך ניסיתן להגיש ${totalNewItems} פריטים.`);
            setIsSubmitting(false);
            return { success: false, message: "אין מספיק מנות בחבילה" };
          }
        } catch (error) {
          console.error("Error checking remaining servings:", error);
          toast.error("שגיאה בבדיקת יתרת המנות. אנא נסו שנית.");
          setIsSubmitting(false);
          return { success: false, message: "שגיאה בבדיקת יתרת המנות" };
        }

        const createdItemsInfo: Array<{ originalItemId: string; itemType: "dish" | "cocktail" | "drink"; itemName: string }> = [];
        if (dishes && dishes.length > 0) {
          const dishIds = await processDishItems(dishes, currentClientId);
          dishIds.forEach((id, index) => createdItemsInfo.push({ originalItemId: id, itemType: "dish", itemName: dishes[index].name }));
        }
        if (cocktails && cocktails.length > 0) {
          const cocktailIds = await processCocktailItems(cocktails, currentClientId);
          cocktailIds.forEach((id, index) => createdItemsInfo.push({ originalItemId: id, itemType: "cocktail", itemName: cocktails[index].name }));
        }
        if (drinks && drinks.length > 0) {
          const drinkIds = await processDrinkItems(drinks, currentClientId);
          drinkIds.forEach((id, index) => createdItemsInfo.push({ originalItemId: id, itemType: "drink", itemName: drinks[index].name }));
        }

        let uploadedBrandingMaterialUrl: string | undefined = undefined;
        if (additionalDetails.brandingMaterials && additionalDetails.brandingMaterials[0] instanceof File) {
          uploadedBrandingMaterialUrl = await uploadFileToStorage(additionalDetails.brandingMaterials[0]);
        }
        const detailsToProcess = { ...additionalDetails };
        delete detailsToProcess.brandingMaterials;
        if (uploadedBrandingMaterialUrl) {
          (detailsToProcess as any).brandingMaterialUrl = uploadedBrandingMaterialUrl;
        }
        await processAdditionalDetails(detailsToProcess, currentClientId);

        if (createdItemsInfo.length > 0) {
          await createBatchSubmissions(currentClientId, createdItemsInfo);
          console.log("Batch submissions created successfully for client:", currentClientId);
        } else {
          console.log("Only additional details processed for client:", currentClientId);
        }

      } else {
        // --- FLOW FOR NEW LEAD (No currentClientId, user is not from 'clients' table) ---
        const leadSubmissionData = {
          dishes: Array.isArray(dishes) ? dishes : [],
          cocktails: Array.isArray(cocktails) ? cocktails : [],
          drinks: Array.isArray(drinks) ? drinks : [],
          additional_details: additionalDetails, // Assuming additionalDetails structure is suitable for JSONB
        };
        
        let uploadedBrandingMaterialUrlLead: string | undefined = undefined;
        if (additionalDetails.brandingMaterials && additionalDetails.brandingMaterials[0] instanceof File) {
          uploadedBrandingMaterialUrlLead = await uploadFileToStorage(additionalDetails.brandingMaterials[0]);
        }

        const leadPayload = {
          email: clientDetails.email,
          restaurant_name: clientDetails.restaurantName,
          contact_name: clientDetails.contactName,
          phone: clientDetails.phoneNumber,
          status: 'new_form_submission', // Or a more descriptive status
          submission_data: leadSubmissionData, // Storing all items and details
          branding_material_url: uploadedBrandingMaterialUrlLead, // Store the URL directly if available
          visual_style_notes: additionalDetails.visualStyle, // Example: store individual fields if preferred
          brand_colors_notes: additionalDetails.brandColors,
          general_notes: additionalDetails.generalNotes,
        };

        const { error: leadInsertError } = await supabase
          .from('leads')
          .insert(leadPayload);

        if (leadInsertError) {
          console.error("Error inserting new lead:", leadInsertError);
          toast.error(`שגיאה בשמירת הפנייה: ${leadInsertError.message}`);
          setIsSubmitting(false);
          return { success: false, message: "שגיאה בשמירת הפנייה" };
        }
        console.log("New lead created successfully with email:", clientDetails.email);
      }

      // Common success steps: Clear form, show toast
      localStorage.removeItem("foodVisionForm");
      setClientDetails({ restaurantName: "", contactName: "", phoneNumber: "", email: "" });
      setDishes([]);
      setCocktails([]);
      setDrinks([]);
      setAdditionalDetails({ visualStyle: "", brandColors: "", generalNotes: "", brandingMaterials: null });
      
      toast.success("תודה! הטופס נשלח בהצלחה. נחזור אליכן תוך 24 שעות.");
      setIsSubmitting(false);
      return { success: true };

    } catch (error: any) {
      console.error("Error in useFoodVisionSubmit:", error);
      toast.error(`אירעה שגיאה בתהליך השליחה: ${error.message || 'Unknown error'}`);
      setIsSubmitting(false);
      return { success: false, message: error.message || "שגיאה כללית בתהליך השליחה" };
    }
  }, [
    clientDetails,
    dishes,
    cocktails,
    drinks,
    additionalDetails,
    setActiveTab,
    setClientDetails,
    setDishes,
    setCocktails,
    setDrinks,
    setAdditionalDetails,
    setIsSubmitting,
  ]);
};
