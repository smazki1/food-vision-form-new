
import { useState, useCallback } from "react";
import { FoodItem } from "@/types/food-vision";

interface UseFoodVisionFormSubmissionProps {
  handleSubmit: (options: any) => Promise<any>;
  validateForm: () => boolean;
  setSubmitError: (error: string | null) => void;
  clientId?: string;
  remainingServings: number;
}

export const useFoodVisionFormSubmission = ({
  handleSubmit,
  validateForm,
  setSubmitError,
  clientId,
  remainingServings
}: UseFoodVisionFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgressMsg, setSubmitProgressMsg] = useState<string | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  // Update progress message when submission state changes
  useState(() => {
    if (isSubmitting) {
      setSubmitProgressMsg("התהליך יכול לקחת מספר שניות. נא לא לצאת מהעמוד.");
      setSubmitError(null);
    } else {
      setSubmitProgressMsg(null);
    }
  });

  const handleFormSubmit = useCallback(async () => {
    // Reset previous error states
    setSubmitError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setSubmitProgressMsg("התהליך יכול לקחת מספר שניות. נא לא לצאת מהעמוד.");
    setIsSubmitting(true);
    
    try {
      const result = await handleSubmit({
        clientId: clientId // Pass the client ID to the submit handler
      });
      
      if (result && result.success) {
        setShowThankYou(true);
      } else if (result && !result.success) {
        setSubmitError(result.message || "אירעה שגיאה בעת שליחת הטופס");
      }
    } catch (err: any) {
      setSubmitError("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  }, [clientId, handleSubmit, setSubmitError, validateForm]);

  const handleCloseThankYou = () => setShowThankYou(false);

  return {
    isSubmitting,
    submitProgressMsg,
    showThankYou,
    handleFormSubmit,
    handleCloseThankYou,
    isSubmitDisabled: clientId && remainingServings <= 0
  };
};
