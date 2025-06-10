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
  const [isLeadSubmission, setIsLeadSubmission] = useState(false);

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
    
    // Track if this is a lead submission (no clientId)
    const wasLeadSubmission = !clientId;
    
    setSubmitProgressMsg("התהליך יכול לקחת מספר שניות. נא לא לצאת מהעמוד.");
    setIsSubmitting(true);
    
    try {
      console.log("[FormSubmitDebug] Calling handleSubmit with clientId:", clientId);
      const result = await handleSubmit({
        clientId: clientId // Pass the client ID to the submit handler
      });
      console.log("[FormSubmitDebug] handleSubmit result:", result);
      
      if (result && result.success) {
        console.log("[FormSubmitDebug] handleSubmit successful, showing thank you.");
        setIsLeadSubmission(wasLeadSubmission);
        setShowThankYou(true);
      } else if (result && typeof result.success === 'boolean' && !result.success) {
        console.log("[FormSubmitDebug] handleSubmit returned success:false. Error message:", result.message);
        setSubmitError(result.message || "אירעה שגיאה בעת שליחת הטופס");
      } else {
        console.log("[FormSubmitDebug] handleSubmit returned unexpected result or no result. Defaulting to error.");
        setSubmitError("אירעה שגיאה בעת שליחת הטופס (תוצאה לא צפויה מההגשה)");
      }
    } catch (err: any) {
      console.error("[FormSubmitDebug] Error caught in useFoodVisionFormSubmission:", err);
      setSubmitError("אירעה שגיאה בעת שליחת הטופס. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsSubmitting(false);
    }
  }, [clientId, handleSubmit, setSubmitError, validateForm]);

  const handleCloseThankYou = () => {
    setShowThankYou(false);
    setIsLeadSubmission(false);
  };

  return {
    isSubmitting,
    submitProgressMsg,
    showThankYou,
    isLeadSubmission,
    handleFormSubmit,
    handleCloseThankYou,
    isSubmitDisabled: !!(clientId && remainingServings <= 0)
  };
};
