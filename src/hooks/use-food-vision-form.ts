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
  
  // Always initialize with empty arrays
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [cocktails, setCocktails] = useState<FoodItem[]>([]);
  const [drinks, setDrinks] = useState<FoodItem[]>([]);
  
  const [additionalDetails, setAdditionalDetails] = useState<AdditionalDetails>({
    visualStyle: "",
    brandColors: "",
    generalNotes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Flag to track if the form has been initialized from localStorage
  const [initialized, setInitialized] = useState(false);

  // Load saved form data from localStorage with validation
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem("foodVisionForm");
      if (!savedForm) {
        console.log("No saved form found");
        setInitialized(true);
        return;
      }

      const parsedForm = JSON.parse(savedForm);
      console.log("Loaded form data:", parsedForm);
      
      // Validate the structure of loaded data
      if (typeof parsedForm !== 'object') {
        console.error("Invalid form data structure");
        setInitialized(true);
        throw new Error('Invalid form data structure');
      }
      
      // Validate and set client details
      if (parsedForm.clientDetails && typeof parsedForm.clientDetails === 'object') {
        setClientDetails({
          restaurantName: parsedForm.clientDetails.restaurantName || "",
          contactName: parsedForm.clientDetails.contactName || "",
          phoneNumber: parsedForm.clientDetails.phoneNumber || "",
          email: parsedForm.clientDetails.email || "",
        });
      }
      
      // Validate and set dishes (ensuring proper File objects)
      if (Array.isArray(parsedForm.dishes)) {
        // Note: File objects can't be serialized to localStorage
        // So we're just keeping the basic dish data without files
        const loadedDishes = parsedForm.dishes.map((dish: any) => ({
          id: dish.id || generateId(),
          name: dish.name || "",
          ingredients: dish.ingredients || "",
          description: dish.description || "",
          notes: dish.notes || "",
          referenceImages: [], // Reset images as they can't be stored in localStorage
        }));
        setDishes(loadedDishes);
      } else {
        console.log("Dishes is not an array in saved form, initializing to empty array");
        setDishes([]);
      }
      
      // Validate and set cocktails
      if (Array.isArray(parsedForm.cocktails)) {
        const loadedCocktails = parsedForm.cocktails.map((cocktail: any) => ({
          id: cocktail.id || generateId(),
          name: cocktail.name || "",
          ingredients: cocktail.ingredients || "",
          description: cocktail.description || "",
          notes: cocktail.notes || "",
          referenceImages: [], // Reset images
        }));
        setCocktails(loadedCocktails);
      } else {
        setCocktails([]);
      }
      
      // Validate and set drinks
      if (Array.isArray(parsedForm.drinks)) {
        const loadedDrinks = parsedForm.drinks.map((drink: any) => ({
          id: drink.id || generateId(),
          name: drink.name || "",
          ingredients: drink.ingredients || "",
          description: drink.description || "",
          notes: drink.notes || "",
          referenceImages: [], // Reset images
        }));
        setDrinks(loadedDrinks);
      } else {
        setDrinks([]);
      }
      
      // Validate and set additional details
      if (parsedForm.additionalDetails && typeof parsedForm.additionalDetails === 'object') {
        setAdditionalDetails({
          visualStyle: parsedForm.additionalDetails.visualStyle || "",
          brandColors: parsedForm.additionalDetails.brandColors || "",
          generalNotes: parsedForm.additionalDetails.generalNotes || "",
        });
      }
      
      setInitialized(true);
    } catch (error) {
      console.error("Error loading saved form:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("foodVisionForm");
      // Initialize with empty arrays
      setDishes([]);
      setCocktails([]);
      setDrinks([]);
      setInitialized(true);
    }
  }, []);

  // Initialize dishes with one empty item if necessary after initialization
  useEffect(() => {
    if (initialized && Array.isArray(dishes) && dishes.length === 0) {
      setDishes([{
        id: generateId(),
        name: "",
        ingredients: "",
        description: "",
        notes: "",
        referenceImages: []
      }]);
    }
  }, [initialized, dishes]);

  // Save form data to localStorage with error handling
  useEffect(() => {
    if (!initialized) return;
    
    try {
      // Create a serializable version of the form data (without File objects)
      const serializableDishes = Array.isArray(dishes) ? dishes.map(dish => ({
        ...dish,
        referenceImages: [] // Don't attempt to serialize File objects
      })) : [];
      
      const serializableCocktails = Array.isArray(cocktails) ? cocktails.map(cocktail => ({
        ...cocktail,
        referenceImages: []
      })) : [];
      
      const serializableDrinks = Array.isArray(drinks) ? drinks.map(drink => ({
        ...drink,
        referenceImages: []
      })) : [];
      
      const formData = {
        clientDetails,
        dishes: serializableDishes,
        cocktails: serializableCocktails,
        drinks: serializableDrinks,
        additionalDetails: {
          ...additionalDetails,
          brandingMaterials: undefined // Don't attempt to serialize File objects
        },
      };
      
      localStorage.setItem("foodVisionForm", JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [initialized, clientDetails, dishes, cocktails, drinks, additionalDetails]);

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
        dishes: Array.isArray(dishes) ? dishes : [],
        cocktails: Array.isArray(cocktails) ? cocktails : [],
        drinks: Array.isArray(drinks) ? drinks : [],
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
    dishes: Array.isArray(dishes) ? dishes : [],
    setDishes,
    cocktails: Array.isArray(cocktails) ? cocktails : [],
    setCocktails,
    drinks: Array.isArray(drinks) ? drinks : [],
    setDrinks,
    additionalDetails,
    setAdditionalDetails,
    isSubmitting,
    handleSubmit,
  };
};
