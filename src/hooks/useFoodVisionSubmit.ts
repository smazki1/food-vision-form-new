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
      return { success: false, message: "חסרים שדות חובה" };
    }
    
    // Calculate total new items being submitted
    const totalNewItems = 
      (Array.isArray(dishes) ? dishes.length : 0) + 
      (Array.isArray(cocktails) ? cocktails.length : 0) + 
      (Array.isArray(drinks) ? drinks.length : 0);
    
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
      const result = await triggerMakeWebhook(completeFormData);
      
      // If user is authenticated, create submissions for each new item
      if (currentClientId && result) {
        // Prepare items for batch submission creation
        const itemsForSubmission = [
          ...(Array.isArray(dishes) ? dishes.map(dish => ({
            originalItemId: dish.id,
            itemType: "dish" as const,
            itemName: dish.name
          })) : []),
          ...(Array.isArray(cocktails) ? cocktails.map(cocktail => ({
            originalItemId: cocktail.id,
            itemType: "cocktail" as const,
            itemName: cocktail.name
          })) : []),
          ...(Array.isArray(drinks) ? drinks.map(drink => ({
            originalItemId: drink.id,
            itemType: "drink" as const,
            itemName: drink.name
          })) : [])
        ];
        
        if (itemsForSubmission.length > 0) {
          await createBatchSubmissions(currentClientId, itemsForSubmission);
        }
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
      });
      
      // Show success message
      toast.success("תודה! הטופס נשלח בהצלחה. נחזור אליך תוך 24 שעות.");
      console.log("[useFoodVisionSubmitDebug] All DB operations successful. Returning success:true.");
      return { success: true };
    } catch (error) {
      console.error("[useFoodVisionSubmitDebug] Error during submission process:", error);
      toast.error("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
      return { success: false, message: "שגיאה פנימית במהלך עיבוד הטופס" };
    } finally {
      setIsSubmitting(false);
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
