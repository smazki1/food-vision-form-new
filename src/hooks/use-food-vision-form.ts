
import { useState, useEffect } from "react";
import { ClientDetails, FoodItem, AdditionalDetails } from "@/types/food-vision";
import { toast } from "sonner";
import { triggerMakeWebhook } from "@/utils/webhook-trigger";

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

  // Load saved form data from localStorage
  useEffect(() => {
    const savedForm = localStorage.getItem("foodVisionForm");
    if (savedForm) {
      try {
        const { clientDetails, dishes, cocktails, drinks, additionalDetails } = JSON.parse(savedForm);
        setClientDetails(clientDetails || {
          restaurantName: "",
          contactName: "",
          phoneNumber: "",
          email: "",
        });
        setDishes(dishes || []);
        setCocktails(cocktails || []);
        setDrinks(drinks || []);
        setAdditionalDetails(additionalDetails || {
          visualStyle: "",
          brandColors: "",
          generalNotes: "",
        });
      } catch (error) {
        console.error("Error loading saved form:", error);
      }
    }
  }, []);

  // Save form data to localStorage
  useEffect(() => {
    const formData = {
      clientDetails,
      dishes,
      cocktails,
      drinks,
      additionalDetails,
    };
    localStorage.setItem("foodVisionForm", JSON.stringify(formData));
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
