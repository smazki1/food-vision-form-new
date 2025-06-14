import { useCallback, useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import { toast } from 'sonner';

export const usePublicFormHandlers = (
  currentStepId: number,
  isLastStep: boolean,
  moveToNextStep: () => void,
  moveToPreviousStep: () => void,
  moveToStep: (step: number) => void,
  validateStep: (stepId: number) => Promise<boolean>,
  clearErrors: () => void,
  onShowExistingBusinessDialog?: () => void
) => {
  const { formData, resetFormData, updateFormData } = useNewItemForm();
  const { isSubmitting, submitForm } = usePublicFormSubmission();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleNext = useCallback(async () => {
    console.log('1. handleNext called');
    const isValid = await validateStep(currentStepId);
    console.log('2. Validation result:', isValid);
    if (isValid && !isLastStep) {
      console.log('3. Moving to next step');
      setShowValidationErrors(false);
      moveToNextStep();
    } else if (!isValid) {
      console.log('3. Validation failed, showing errors');
      setShowValidationErrors(true);
      toast.error('יש לתקן את השגיאות כדי להמשיך');
    }
  }, [currentStepId, isLastStep, moveToNextStep, validateStep]);

  const handlePrevious = useCallback(() => {
    clearErrors();
    setShowValidationErrors(false);
    if (currentStepId > 1) {
      moveToPreviousStep();
    }
  }, [clearErrors, moveToPreviousStep, currentStepId]);

  const handleSubmit = useCallback(async () => {
    console.log('1. handleSubmit started');
    const isValid = await validateStep(currentStepId);
    console.log('2. Validation result:', isValid);
    if (!isValid) {
      setShowValidationErrors(true);
      toast.error('יש לתקן את השגיאות כדי להגיש');
      return;
    }

    try {
      console.log('3. Submitting form data');
      const success = await submitForm(formData);
      console.log('4. Submit result:', success);
      
      if (success) {
        console.log('5. Setting success modal based on business type');
        
        // Show different success dialogs based on business type
        if (formData.isNewBusiness === false) {
          console.log('6. Showing existing business dialog');
          onShowExistingBusinessDialog?.();
        } else {
          console.log('6. Showing standard success modal');
          setShowSuccessModal(true);
          setTimeout(() => {
            console.log('7. Modal state after delay:', showSuccessModal);
            if (!showSuccessModal) {
              setShowSuccessModal(true);
            }
          }, 300);
        }
        
        toast.success('המנה נשלחה בהצלחה!');

        // Debug logs for Make.com webhook call
        console.log('Sending to Make.com Webhook:');
        console.log('URL:', 'https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u');
        console.log('Method:', 'POST');
        const webhookHeaders = { 'Content-Type': 'application/json' };
        console.log('Headers:', webhookHeaders);
        // Deep log formData to inspect its structure carefully
        console.log('Body (raw formData before stringify):', JSON.parse(JSON.stringify(formData))); 
        let stringifiedBody = '';
        try {
          stringifiedBody = JSON.stringify(formData);
          console.log('Body (stringified formData):', stringifiedBody);
        } catch (e) {
          console.error('Error stringifying formData:', e);
          console.log('Problematic formData:', formData); 
        }

        if (stringifiedBody) { // Only fetch if stringification was successful
          fetch('https://hook.eu2.make.com/h15kqbjphouh5wvmsnvxopkl7tff8o7u', {
            method: 'POST',
            headers: webhookHeaders,
            body: stringifiedBody
          }).then(response => {
            console.log('Make.com Webhook response status:', response.status);
            if (!response.ok) {
              response.text().then(text => console.error('Make.com Webhook error response body:', text));
            }
            return response.json(); // Or response.text() if not expecting JSON back
          }).then(data => {
            console.log('Make.com Webhook success response data:', data);
          }).catch((err) => {
              console.error('Error sending to Make.com Webhook or parsing response:', err);
              console.log('Original formData that caused fetch error (if any):', formData);
          });
        }
      } else {
        console.log('5. Submission failed');
      }
    } catch (e) {
      console.error('Error during form submission:', e);
      toast.error('שגיאה בשליחת הטופס');
    }
  }, [currentStepId, validateStep, submitForm, formData, showSuccessModal]);

  const handleNewSubmission = useCallback(() => {
    console.log('handleNewSubmission called');
    const { restaurantName, submitterName } = formData;
    resetFormData();
    setTimeout(() => {
      updateFormData({ restaurantName, submitterName });
      if (restaurantName) {
        moveToStep(2);
      } else {
        moveToStep(1);
      }
    }, 100);
    clearErrors();
    setShowValidationErrors(false);
    setShowSuccessModal(false);
  }, [resetFormData, updateFormData, moveToStep, clearErrors, formData.restaurantName, formData.submitterName]);

  const handleCloseSuccessModal = useCallback(() => {
    console.log('handleCloseSuccessModal called');
    setShowSuccessModal(false);
  }, []);

  return {
    handleNext,
    handlePrevious,
    handleSubmit,
    handleNewSubmission,
    handleCloseSuccessModal,
    isSubmitting,
    showSuccessModal,
    showValidationErrors,
    setShowValidationErrors
  };
};
