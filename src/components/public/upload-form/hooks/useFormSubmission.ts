
import { useState } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { toast } from 'sonner';

export const useFormSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formData, resetFormData } = useNewItemForm();

  const submitForm = async (): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Form submitted:', formData);
      
      toast.success('הפריט נשלח בהצלחה! תקבלו עדכון בקרוב.');
      resetFormData();
      
      return true;
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('אירעה שגיאה בשליחת הפריט. אנא נסו שוב.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitForm,
    isSubmitting
  };
};
