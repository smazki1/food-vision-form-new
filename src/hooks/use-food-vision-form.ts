import { useState, useEffect } from "react";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { toast } from "sonner";
import { triggerMakeWebhook } from "@/utils/webhook-trigger";
import { generateId } from "@/utils/generateId";

export const useFoodVisionForm = () => {
  const [activeTab, setActiveTab] = useState("client");
  const [clientDetails, setClientDetails] = useState<ClientDetails>({
    restaurantName: "",
    contactName: "",
    phoneNumber: "",
    email: "",
  });
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [cocktails, setCocktails] = useState<FoodItem[]>([]);
  const [drinks, setDrinks] = useState<FoodItem[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState<AdditionalDetails>({
    visualStyle: "",
    brandColors: "",
    generalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved form data from localStorage with validation
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem("foodVisionForm");
      if (!savedForm) return;

      const parsedForm = JSON.parse(savedForm);
      
      // Validate the structure of loaded data
      if (typeof parsedForm !== 'object') throw new Error('Invalid form data structure');
      
      // Validate and set client details
      if (parsedForm.clientDetails && typeof parsedForm.clientDetails === 'object') {
        setClientDetails({
          restaurantName: parsedForm.clientDetails.restaurantName || "",
          contactName: parsedForm.clientDetails.contactName || "",
          phoneNumber: parsedForm.clientDetails.phoneNumber || "",
          email: parsedForm.clientDetails.email || "",
        });
      }
      
      // Validate and set dishes
      if (Array.isArray(parsedForm.dishes)) {
        setDishes(parsedForm.dishes.map((dish: any) => ({
          id: dish.id || generateId(),
          name: dish.name || "",
          ingredients: dish.ingredients || "",
          description: dish.description || "",
          notes: dish.notes || "",
          referenceImages: dish.referenceImages || [],
        })));
      }
      
      // Validate and set cocktails
      if (Array.isArray(parsedForm.cocktails)) {
        setCocktails(parsedForm.cocktails.map((cocktail: any) => ({
          id: cocktail.id || generateId(),
          name: cocktail.name || "",
          ingredients: cocktail.ingredients || "",
          description: cocktail.description || "",
          notes: cocktail.notes || "",
          referenceImages: cocktail.referenceImages || [],
        })));
      }
      
      // Validate and set drinks
      if (Array.isArray(parsedForm.drinks)) {
        setDrinks(parsedForm.drinks.map((drink: any) => ({
          id: drink.id || generateId(),
          name: drink.name || "",
          ingredients: drink.ingredients || "",
          description: drink.description || "",
          notes: drink.notes || "",
          referenceImages: drink.referenceImages || [],
        })));
      }
      
      // Validate and set additional details
      if (parsedForm.additionalDetails && typeof parsedForm.additionalDetails === 'object') {
        setAdditionalDetails({
          visualStyle: parsedForm.additionalDetails.visualStyle || "",
          brandColors: parsedForm.additionalDetails.brandColors || "",
          generalNotes: parsedForm.additionalDetails.generalNotes || "",
        });
      }
    } catch (error) {
      console.error("Error loading saved form:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("foodVisionForm");
    }
  }, []);

  // Save form data to localStorage with error handling
  useEffect(() => {
    try {
      const formData = {
        clientDetails,
        dishes,
        cocktails,
        drinks,
        additionalDetails,
      };
      localStorage.setItem("foodVisionForm", JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [clientDetails, dishes, cocktails, drinks, additionalDetails]);

  const handleSubmit = async () => {
    // Validate required fields
    if (!clientDetails.restaurantName || !clientDetails.contactName || 
        !clientDetails.phoneNumber || !clientDetails.email) {
      toast("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare complete form data for webhook
      const completeFormData = {
        clientDetails,
        dishes,
        cocktails,
        drinks,
        additionalDetails
      };

      // Trigger webhook
      await triggerMakeWebhook(completeFormData);

      toast.success("תודה! הטופס נשלח בהצלחה. נחזור אליך תוך 24 שעות.");
      
      // Clear the form after successful submission
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
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    clientDetails,
    setClientDetails,
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
    additionalDetails,
    setAdditionalDetails,
    isSubmitting,
    handleSubmit,
  };
};
