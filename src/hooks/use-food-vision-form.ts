
import { useState, useEffect } from "react";
import { useClientDetails } from "./useClientDetails";
import { useFoodItems } from "./useFoodItems";
import { useAdditionalDetails } from "./useAdditionalDetails";
import { toast } from "sonner";
import { triggerMakeWebhook } from "@/utils/webhook-trigger";
import { generateId } from "@/utils/generateId";
import { FoodItem, AdditionalDetails } from "@/types/food-vision";

export const useFoodVisionForm = () => {
  const [activeTab, setActiveTab] = useState("client");
  const { clientDetails, setClientDetails } = useClientDetails();
  const {
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
    ensureAtLeastOneItem
  } = useFoodItems();
  const { additionalDetails, setAdditionalDetails } = useAdditionalDetails();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Load/sync logic from localStorage
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem("foodVisionForm");
      if (!savedForm) {
        setInitialized(true);
        return;
      }
      const parsedForm = JSON.parse(savedForm);

      if (parsedForm?.clientDetails) {
        setClientDetails({
          restaurantName: parsedForm.clientDetails.restaurantName || "",
          contactName: parsedForm.clientDetails.contactName || "",
          phoneNumber: parsedForm.clientDetails.phoneNumber || "",
          email: parsedForm.clientDetails.email || "",
        });
      }

      if (Array.isArray(parsedForm.dishes)) {
        setDishes(parsedForm.dishes.map((dish: any) => ({
          id: dish.id || generateId(),
          name: dish.name || "",
          ingredients: dish.ingredients || "",
          description: dish.description || "",
          notes: dish.notes || "",
          referenceImages: [],
        })));
      } else {
        setDishes([]);
      }

      if (Array.isArray(parsedForm.cocktails)) {
        setCocktails(parsedForm.cocktails.map((cocktail: any) => ({
          id: cocktail.id || generateId(),
          name: cocktail.name || "",
          ingredients: cocktail.ingredients || "",
          description: cocktail.description || "",
          notes: cocktail.notes || "",
          referenceImages: [],
        })));
      } else {
        setCocktails([]);
      }

      if (Array.isArray(parsedForm.drinks)) {
        setDrinks(parsedForm.drinks.map((drink: any) => ({
          id: drink.id || generateId(),
          name: drink.name || "",
          ingredients: drink.ingredients || "",
          description: drink.description || "",
          notes: drink.notes || "",
          referenceImages: [],
        })));
      } else {
        setDrinks([]);
      }

      if (parsedForm?.additionalDetails) {
        setAdditionalDetails({
          visualStyle: parsedForm.additionalDetails.visualStyle || "",
          brandColors: parsedForm.additionalDetails.brandColors || "",
          generalNotes: parsedForm.additionalDetails.generalNotes || "",
        });
      }

      setInitialized(true);
    } catch (error) {
      console.error("Error loading saved form:", error);
      localStorage.removeItem("foodVisionForm");
      setDishes([]);
      setCocktails([]);
      setDrinks([]);
      setInitialized(true);
    }
  }, []);

  // Ensure at least one dish after initialization
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
  }, [initialized, dishes, setDishes]);

  // Save to localStorage
  useEffect(() => {
    if (!initialized) return;

    try {
      const serializableDishes = dishes.map(dish => ({
        ...dish,
        referenceImages: []
      }));
      const serializableCocktails = cocktails.map(cocktail => ({
        ...cocktail,
        referenceImages: []
      }));
      const serializableDrinks = drinks.map(drink => ({
        ...drink,
        referenceImages: []
      }));

      const formData = {
        clientDetails,
        dishes: serializableDishes,
        cocktails: serializableCocktails,
        drinks: serializableDrinks,
        additionalDetails: {
          ...additionalDetails,
          brandingMaterials: undefined
        },
      };

      localStorage.setItem("foodVisionForm", JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }, [initialized, clientDetails, dishes, cocktails, drinks, additionalDetails]);

  const handleSubmit = async () => {
    if (!clientDetails.restaurantName || !clientDetails.contactName ||
        !clientDetails.phoneNumber || !clientDetails.email) {
      toast("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return;
    }

    setIsSubmitting(true);
    try {
      const completeFormData = {
        clientDetails,
        dishes: Array.isArray(dishes) ? dishes : [],
        cocktails: Array.isArray(cocktails) ? cocktails : [],
        drinks: Array.isArray(drinks) ? drinks : [],
        additionalDetails
      };
      await triggerMakeWebhook(completeFormData);
      toast.success("תודה! הטופס נשלח בהצלחה. נחזור אליך תוך 24 שעות.");
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
