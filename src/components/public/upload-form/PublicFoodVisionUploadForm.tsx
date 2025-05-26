import React, { useState, useEffect } from 'react';
import ItemDetailsStep from '@/components/customer/upload-form/steps/ItemDetailsStep';
import ImageUploadStep from '@/components/customer/upload-form/steps/ImageUploadStep';
import PublicReviewSubmitStep from './steps/PublicReviewSubmitStep';
import RestaurantNameStep from './steps/RestaurantNameStep'; // To be created
import { Button } from '@/components/ui/button';
import { NewItemFormData, useNewItemForm, ItemType } from '@/contexts/NewItemFormContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import FormProgress from '@/components/customer/upload-form/FormProgress';
import { cn } from '@/lib/utils';

// Simplified StepProps for public form
export interface PublicStepProps {
  setExternalErrors?: (errors: Record<string, string>) => void;
  clearExternalErrors?: () => void;
  errors?: Record<string, string>;
  onFinalSubmit?: () => void; // May not be needed if ReviewSubmitStep handles it
}

const publicFormSteps = [
  {
    id: 1,
    name: 'שם מסעדה',
    component: RestaurantNameStep, // New step
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.restaurantName?.trim()) newErrors.restaurantName = 'שם המסעדה הוא שדה חובה.';
      return newErrors;
    }
  },
  {
    id: 2,
    name: 'פרטי פריט',
    component: ItemDetailsStep,
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (!data.itemName.trim()) newErrors.itemName = 'שם הפריט הוא שדה חובה.';
      if (!data.itemType) newErrors.itemType = 'סוג הפריט הוא שדה חובה.';
      return newErrors;
    }
  },
  {
    id: 3,
    name: 'העלאת תמונות',
    component: ImageUploadStep,
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      if (data.referenceImages.length < 1) newErrors.referenceImages = 'יש להעלות לפחות תמונה אחת.';
      if (data.referenceImages.length > 10) newErrors.referenceImages = 'ניתן להעלות עד 10 תמונות.';
      return newErrors;
    }
  },
  {
    id: 4,
    name: 'סקירה ואישור',
    component: PublicReviewSubmitStep,
    validate: (data: NewItemFormData) => {
      const newErrors: Record<string, string> = {};
      // Add any specific validation for the public form review step if needed
      if (data.referenceImages.length === 0) newErrors.finalCheck = "יש להעלות לפחות תמונה אחת לפני ההגשה.";
      return newErrors;
    }
  }
];

const PublicFoodVisionUploadForm: React.FC = () => {
  const [currentStepId, setCurrentStepId] = useState(publicFormSteps[0].id);
  const { formData, resetFormData, updateFormData } = useNewItemForm();
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Reset form data only once when component mounts
  useEffect(() => {
    resetFormData(); 
  }, []); // Empty dependency array ensures it runs only once on mount

  const typedFormSteps = publicFormSteps.map(step => ({ id: step.id, name: step.name }));
  const CurrentStepComponent = publicFormSteps.find(step => step.id === currentStepId)?.component || (() => <div>שלב לא תקין</div>);
  const currentStepConfig = publicFormSteps.find(step => step.id === currentStepId);

  const handleClearStepErrors = () => {
    setStepErrors({});
  };

  const handleNext = async () => {
    if (currentStepConfig?.validate) {
      const newErrors = currentStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length === 0) {
        const currentIndex = publicFormSteps.findIndex(step => step.id === currentStepId);
        if (currentIndex < publicFormSteps.length - 1) {
          setCurrentStepId(publicFormSteps[currentIndex + 1].id);
          window.scrollTo(0, 0);
        } else {
          // This case (being on the last step and clicking 'Next')
          // should ideally be handled by the ReviewSubmitStep's own submit button.
          // If ReviewSubmitStep has its own submission logic, this might not be strictly necessary.
          await handleSubmit(); 
        }
      }
    }
  };

  const handlePrevious = () => {
    setStepErrors({});
    const currentIndex = publicFormSteps.findIndex(step => step.id === currentStepId);
    if (currentIndex > 0) {
      setCurrentStepId(publicFormSteps[currentIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    // Final validation before submitting (e.g., from Review step)
    const reviewStepConfig = publicFormSteps.find(step => step.id === 4); // Assuming ID 4 is Review
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        toast.error("אנא תקנו את השגיאות בטופס הסקירה.");
        if (currentStepId !== reviewStepConfig.id) setCurrentStepId(reviewStepConfig.id);
        return;
      }
    }

    if (!formData.restaurantName?.trim()) {
        toast.error("שם המסעדה הוא שדה חובה.");
        setStepErrors({ restaurantName: "שם המסעדה הוא שדה חובה." });
        if (currentStepId !== 1) setCurrentStepId(1); // Go to restaurant name step
        return;
    }

    setIsSubmitting(true);
    toast.info("מעלים פרטי פריט ותמונות...");

    const sanitizeName = (name: string) => {
      // Allow letters, numbers, spaces, hyphens, underscores, periods
      // Replace other characters with an underscore
      // Specifically keep Hebrew characters for restaurant name if desired, but ensure it's URL-safe for path segment
      // For file names, it's safer to stick to ASCII or ensure encoding/decoding is handled perfectly.
      // For now, let's be relatively strict for file path segments to avoid issues.
      return name.replace(/[^a-zA-Z0-9_\-\.\s]/g, '_').replace(/\s+/g, '_');
    };

    try {
      const uploadedImageUrls: string[] = [];
      const sanitizedRestaurantName = formData.restaurantName ? sanitizeName(formData.restaurantName) : 'unknown-restaurant';

      for (const file of formData.referenceImages) {
        if (file instanceof File) {
            const originalFileName = file.name;
            const sanitizedOriginalFileName = sanitizeName(originalFileName);
            const fileName = `${Date.now()}-${sanitizedOriginalFileName}`;
            const filePath = `public-uploads/${sanitizedRestaurantName}/${fileName}`;
            
            console.log(`[UploadDebug] Attempting to upload to path: ${filePath}`); // Log the exact path

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('food-vision-images') // Changed from 'food-vision-items' to 'food-vision-images'
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading file:', uploadError);
                throw new Error(`שגיאה בהעלאת קובץ: ${file.name}. ${uploadError.message}`);
            }
            // Construct the public URL. Adjust if your bucket/CDN setup is different.
            const { data: publicUrlData } = supabase.storage
                .from('food-vision-images') // Changed from 'food-vision-items' to 'food-vision-images'
                .getPublicUrl(filePath);
            uploadedImageUrls.push(publicUrlData.publicUrl);
        } else if (typeof file === 'string') {
            // If it's already a URL (e.g., from a previous upload attempt or external source)
            uploadedImageUrls.push(file);
        }
      }
      
      // 2. Call the public RPC function
      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        {
          p_restaurant_name: formData.restaurantName,
          p_item_type: formData.itemType.toLowerCase() as 'dish' | 'cocktail' | 'drink',
          p_item_name: formData.itemName,
          p_description: formData.description || null,
          p_notes: formData.specialNotes || null,
          p_reference_image_urls: uploadedImageUrls,
        }
      );

      if (submissionError) {
        console.error('Error submitting item via RPC:', submissionError);
        throw submissionError;
      }

      toast.success("הפריט הוגש בהצלחה!" + (formData.restaurantName ? ` עבור ${formData.restaurantName}` : ''));
      resetFormData();
      // Navigate to a success page or clear the form
      setCurrentStepId(publicFormSteps[0].id); // Go back to the first step
      // navigate('/public-submission-success'); // Or navigate to a dedicated success page

    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`שגיאה בהגשה: ${error.message || 'אירעה שגיאה לא צפויה.'}`);
      setStepErrors({ submit: error.message || 'אירעה שגיאה לא צפויה.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const showNavigationButtons = currentStepConfig && currentStepConfig.id !== 4; // Don't show for ReviewSubmitStep if it has its own submit
  const isLastNonReviewStep = currentStepConfig && currentStepConfig.id === publicFormSteps.find(s => s.id === 3)?.id; // e.g. ImageUpload is last before Review

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white shadow-xl rounded-lg">
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
        העלאת פריט חדש (ציבורי)
      </h1>
      
      <FormProgress formSteps={typedFormSteps} currentStepId={currentStepId} />

      <div className="mt-8 min-h-[300px]"> 
        <CurrentStepComponent 
            key={currentStepId}
            setExternalErrors={setStepErrors} 
            clearExternalErrors={handleClearStepErrors}
            errors={stepErrors}
            // Pass onFinalSubmit if the ReviewSubmitStep should trigger the main form's handleSubmit
            // This is useful if ReviewSubmitStep is generic and doesn't have its own submission logic.
            // If ReviewSubmitStep calls handleSubmit directly, this prop might not be needed.
            onFinalSubmit={currentStepId === 4 ? handleSubmit : undefined} 
        />
      </div>

      {Object.keys(stepErrors).length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-semibold text-red-700">אנא תקנו את השגיאות הבאות:</h3>
          <ul className="list-disc list-inside text-sm text-red-600 mt-1">
            {Object.entries(stepErrors).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        </div>
      )}
      
      {showNavigationButtons && (
        <div className={cn(
            "flex mt-8 pt-6 border-t",
            currentStepId === publicFormSteps[0].id ? "justify-end" : "justify-between"
        )}>
          {currentStepId !== publicFormSteps[0].id && (
            <Button variant="outline" onClick={handlePrevious} disabled={isSubmitting} className="flex items-center">
              <ChevronRight className="ml-2 h-4 w-4" /> {/* Assuming Hebrew (RTL), so Right arrow for Previous */}
              הקודם
            </Button>
          )}
          <Button onClick={handleNext} disabled={isSubmitting} className="flex items-center">
            {isSubmitting ? 'מעבד...' : (isLastNonReviewStep ? 'לסקירה ואישור' : 'הבא')}
            <ChevronLeft className="mr-2 h-4 w-4" /> {/* Assuming Hebrew (RTL), so Left arrow for Next */}
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicFoodVisionUploadForm; 