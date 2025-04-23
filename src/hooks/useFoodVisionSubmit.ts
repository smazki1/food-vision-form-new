
import { useCallback } from "react";
import { toast } from "sonner";
import { triggerMakeWebhook } from "@/utils/webhook-trigger";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";

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
  setIsSubmitting
}: any) => {
  return useCallback(async () => {
    // Validate required fields
    if (!clientDetails.restaurantName ||
        !clientDetails.contactName ||
        !clientDetails.phoneNumber ||
        !clientDetails.email) {
      toast.error("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return { success: false, message: "חסרים שדות חובה" };
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
      
      // Trigger webhook to send data
      await triggerMakeWebhook(completeFormData);
      
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
      return { success: true };
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
      return { success: false, message: "שגיאת שרת" };
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
    setIsSubmitting
  ]);
};
