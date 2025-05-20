import { useCallback } from "react";
import { toast } from "sonner";
import { triggerMakeWebhook } from "@/utils/webhook-trigger";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { createBatchSubmissions, getClientRemainingServings } from "@/api/submissionApi";

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

    // Validate required fields
    if (!clientDetails.restaurantName ||
        !clientDetails.contactName ||
        !clientDetails.phoneNumber ||
        !clientDetails.email) {
      toast.error("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return { success: false, message: "חסרים שדות חובה בפרטי הלקוח" };
    }
    
    // Calculate total new items being submitted
    const totalNewItems = 
      (Array.isArray(dishes) ? dishes.length : 0) + 
      (Array.isArray(cocktails) ? cocktails.length : 0) + 
      (Array.isArray(drinks) ? drinks.length : 0);
    
    // If there are no items to submit, but client details might be new (e.g. first time for an unauth user)
    // We might still want to run getOrCreateClient part of triggerMakeWebhook
    // For now, let's assume if totalNewItems is 0, it's not a full valid submission for creating customer_submissions.
    // This could be adjusted if just saving client details is a valid standalone action.
    if (totalNewItems === 0 && !additionalDetails.visualStyle && !additionalDetails.brandColors && !additionalDetails.generalNotes && !additionalDetails.brandingMaterials) {
        toast.info("אנא הוסף לפחות פריט אחד או פרטים נוספים לשליחה.");
        return { success: false, message: "אין פריטים לשליחה" };
    }
    
    // If client is authenticated, check if they have enough servings
    if (currentClientId) {
      try {
        const remainingServings = await getClientRemainingServings(currentClientId);
        
        if (remainingServings < totalNewItems) {
          toast.error(`אין מספיק מנות בחבילה. נותרו ${remainingServings} מנות, אך ניסית להגיש ${totalNewItems} פריטים.`);
          return { success: false, message: "אין מספיק מנות בחבילה" };
        }
      } catch (error) {
        console.error("Error checking remaining servings:", error);
        // Continue with submission as the trigger will enforce servings check
      }
    }
    
    // Begin submission process
    setIsSubmitting(true);
    
    try {
      const completeFormData = {
        clientDetails,
        dishes: Array.isArray(dishes) ? dishes : [],
        cocktails: Array.isArray(cocktails) ? cocktails : [],
        drinks: Array.isArray(drinks) ? drinks : [],
        additionalDetails
      };
      
      // Trigger webhook to send data (which will create the items in respective tables)
      const webhookResult = await triggerMakeWebhook(completeFormData);
      
      if (!webhookResult.success) {
        // Error messages are handled by triggerMakeWebhook or getOrCreateClient via toast
        // Ensure submission state is reset
        setIsSubmitting(false);
        return { success: false, message: webhookResult.error || "עיבוד ראשוני נכשל" };
      }

      // Use the clientId and createdItemsInfo from webhookResult
      const resolvedClientId = webhookResult.clientId;
      const itemsForSubmission = webhookResult.createdItemsInfo || [];

      // If a client was identified/created AND items were processed successfully by webhook-trigger
      // (which implies dishes/cocktails/drinks were saved and their DB IDs are in itemsForSubmission)
      // then create the customer_submission records.
      if (resolvedClientId && itemsForSubmission.length > 0) {
         // Check remaining servings if client is identified
        try {
          const remainingServings = await getClientRemainingServings(resolvedClientId);
          if (remainingServings < totalNewItems) {
            toast.error(`אין מספיק מנות בחבילה. נותרו ${remainingServings} מנות, אך ניסית להגיש ${totalNewItems} פריטים.`);
            setIsSubmitting(false);
            return { success: false, message: "אין מספיק מנות בחבילה" };
          }
        } catch (servingsError) {
          console.error("Error checking remaining servings:", servingsError);
          // Decide if this is a hard stop or a warning. For now, let's make it a hard stop.
          toast.error("שגיאה בבדיקת יתרת המנות. אנא נסה שוב.");
          setIsSubmitting(false);
          return { success: false, message: "שגיאה בבדיקת יתרת המנות" };
        }
        
        await createBatchSubmissions(resolvedClientId, itemsForSubmission);
        console.log("Batch submissions created successfully for client:", resolvedClientId);
      } else if (resolvedClientId && totalNewItems === 0 && (additionalDetails.visualStyle || additionalDetails.brandColors || additionalDetails.generalNotes || (additionalDetails as any).brandingMaterialUrl)){
        // Case: Only additional details were submitted for an existing/new client, no new items to make submissions for.
        // This is fine, getOrCreateClient and processAdditionalDetails already ran.
        console.log("Additional details processed for client:", resolvedClientId, "No new items for batch submission.");
      } else if (!resolvedClientId && totalNewItems > 0) {
        // This case should ideally be caught by webhookResult.success being false earlier if client ID is essential
        console.warn("Items processed but no client ID was resolved. Batch submissions not created.");
      }
      
      // Clear form data after successful submission
      localStorage.removeItem("foodVisionForm");
      setClientDetails({
        restaurantName: "",
        contactName: "",
        phoneNumber: "",
        email: "",
      });
      setDishes([]);
      setCocktails([]);
      setDrinks([]);
      setAdditionalDetails({
        visualStyle: "",
        brandColors: "",
        generalNotes: "",
        brandingMaterials: null,
      });
      
      // Show success message
      toast.success("תודה! הטופס נשלח בהצלחה. נחזור אליך תוך 24 שעות.");
      console.log("[useFoodVisionSubmitDebug] All DB operations successful. Returning success:true.");
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
