
import { useState, useEffect } from "react";
import { ClientDetails } from "@/types/food-vision";

export const useFoodVisionFormValidation = (
  clientDetails: ClientDetails,
  setActiveTab: (tab: string) => void
) => {
  const [isFormValid, setIsFormValid] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Check if client details are valid
  useEffect(() => {
    const isValid = Boolean(
      clientDetails.restaurantName &&
      clientDetails.contactName &&
      clientDetails.phoneNumber &&
      clientDetails.email
    );
    setIsFormValid(isValid);
    console.log("Form validation state:", { isValid, clientDetails });
  }, [clientDetails]);

  // Scroll to error message if it exists
  useEffect(() => {
    if (submitError) {
      const errorElement = document.getElementById('form-error-message');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [submitError]);
  
  // Validate form before submission
  const validateForm = () => {
    if (!clientDetails.restaurantName ||
        !clientDetails.contactName ||
        !clientDetails.phoneNumber ||
        !clientDetails.email) {
      setIsFormValid(false);
      setSubmitError("אנא מלא את כל שדות החובה בכרטיסיית פרטי הלקוח");
      setActiveTab("client");
      return false;
    }
    return true;
  };

  return { 
    isFormValid, 
    submitError, 
    setSubmitError,
    validateForm 
  };
};
