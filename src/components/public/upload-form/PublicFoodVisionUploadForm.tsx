
import React, { useState, useEffect } from 'react';
import ItemDetailsStep from '@/components/customer/upload-form/steps/ItemDetailsStep';
import ImageUploadStep from '@/components/customer/upload-form/steps/ImageUploadStep';
import PublicReviewSubmitStep from './steps/PublicReviewSubmitStep';
import RestaurantNameStep from './steps/RestaurantNameStep'; 
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
  onFinalSubmit?: () => void; 
}

const publicFormSteps = [
  {
    id: 1,
    name: 'שם מסעדה',
    component: RestaurantNameStep, 
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
  }, []); 

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
    console.log('[PublicSubmit] Starting submission process...');
    console.log('[PublicSubmit] Form data:', formData);
    
    // Final validation before submitting
    const reviewStepConfig = publicFormSteps.find(step => step.id === 4); 
    if (reviewStepConfig?.validate) {
      const newErrors = reviewStepConfig.validate(formData);
      setStepErrors(newErrors);
      if (Object.keys(newErrors).length > 0) {
        console.log('[PublicSubmit] Validation errors:', newErrors);
        toast.error("אנא תקנו את השגיאות בטופס הסקירה.");
        if (currentStepId !== reviewStepConfig.id) setCurrentStepId(reviewStepConfig.id);
        return;
      }
    }

    // Validate required fields
    if (!formData.restaurantName?.trim()) {
        console.log('[PublicSubmit] Missing restaurant name');
        toast.error("שם המסעדה הוא שדה חובה.");
        setStepErrors({ restaurantName: "שם המסעדה הוא שדה חובה." });
        setCurrentStepId(1); 
        return;
    }

    if (!formData.itemName?.trim()) {
        console.log('[PublicSubmit] Missing item name');
        toast.error("שם הפריט הוא שדה חובה.");
        setStepErrors({ itemName: "שם הפריט הוא שדה חובה." });
        setCurrentStepId(2); 
        return;
    }

    if (!formData.itemType) {
        console.log('[PublicSubmit] Missing item type');
        toast.error("סוג הפריט הוא שדה חובה.");
        setStepErrors({ itemType: "סוג הפריט הוא שדה חובה." });
        setCurrentStepId(2); 
        return;
    }

    if (formData.referenceImages.length === 0) {
        console.log('[PublicSubmit] No images uploaded');
        toast.error("יש להעלות לפחות תמונה אחת.");
        setStepErrors({ referenceImages: "יש להעלות לפחות תמונה אחת." });
        setCurrentStepId(3); 
        return;
    }

    setIsSubmitting(true);
    toast.info("מעלה פרטי פריט ותמונות...");

    try {
      console.log('[PublicSubmit] Starting image upload process...');
      const uploadedImageUrls: string[] = [];

      // Upload images to storage
      for (let i = 0; i < formData.referenceImages.length; i++) {
        const file = formData.referenceImages[i];
        if (file instanceof File) {
            const fileExt = file.name.split('.').pop() || 'jpg';
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `public-submissions/${fileName}`;
            
            console.log(`[PublicSubmit] Uploading file ${i + 1}/${formData.referenceImages.length} to: ${filePath}`);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('food-vision-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error(`[PublicSubmit] Upload error for file ${i + 1}:`, uploadError);
                throw new Error(`שגיאה בהעלאת תמונה ${i + 1}: ${uploadError.message}`);
            }
            
            console.log(`[PublicSubmit] Upload successful for file ${i + 1}:`, uploadData);

            const { data: publicUrlData } = supabase.storage
                .from('food-vision-images')
                .getPublicUrl(filePath);
            
            uploadedImageUrls.push(publicUrlData.publicUrl);
            console.log(`[PublicSubmit] Generated public URL ${i + 1}:`, publicUrlData.publicUrl);
        }
      }
      
      console.log('[PublicSubmit] All images uploaded successfully. URLs:', uploadedImageUrls);
      
      // Prepare RPC parameters with correct structure
      const rpcParams = {
        p_restaurant_name: formData.restaurantName.trim(),
        p_item_type: formData.itemType.toLowerCase() as 'dish' | 'cocktail' | 'drink',
        p_item_name: formData.itemName.trim(),
        p_description: formData.description?.trim() || null,
        p_category: formData.itemType !== 'cocktail' ? 
          (formData.description?.trim() || null) : null,
        p_ingredients: formData.itemType === 'cocktail' ? 
          (formData.description?.trim() ? formData.description.split(',').map(i => i.trim()) : null) : null,
        p_reference_image_urls: uploadedImageUrls,
      };

      console.log('[PublicSubmit] Calling RPC with params:', rpcParams);

      const { data: submissionData, error: submissionError } = await supabase.rpc(
        'public_submit_item_by_restaurant_name',
        rpcParams
      );

      if (submissionError) {
        console.error('[PublicSubmit] RPC error:', submissionError);
        throw new Error(`שגיאה בהגשה: ${submissionError.message}`);
      }

      console.log('[PublicSubmit] RPC response:', submissionData);
      
      // Check if response is valid JSON object
      if (submissionData && typeof submissionData === 'object') {
        if (submissionData.success) {
          toast.success(submissionData.message || 'הפריט הוגש בהצלחה!');
          resetFormData();
          setCurrentStepId(publicFormSteps[0].id);
          setStepErrors({});
          console.log('[PublicSubmit] Submission completed successfully');
        } else {
          console.error('[PublicSubmit] RPC returned success=false:', submissionData);
          throw new Error(submissionData.message || 'הגשה נכשלה - אנא נסו שוב');
        }
      } else {
        console.error('[PublicSubmit] Unexpected response format:', submissionData);
        throw new Error('תגובה לא צפויה מהשרת');
      }

    } catch (error: any) {
      console.error("[PublicSubmit] Error in submission process:", error);
      toast.error(`שגיאה בהגשה: ${error.message || 'אירעה שגיאה לא צפויה.'}`);
      setStepErrors({ submit: error.message || 'אירעה שגיאה לא צפויה.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const showNavigationButtons = currentStepConfig && currentStepConfig.id !== 4; 
  const isLastNonReviewStep = currentStepConfig && currentStepConfig.id === publicFormSteps.find(s => s.id === 3)?.id; 

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
              <ChevronRight className="ml-2 h-4 w-4" /> 
              הקודם
            </Button>
          )}
          <Button onClick={handleNext} disabled={isSubmitting} className="flex items-center">
            {isSubmitting ? 'מעבד...' : (isLastNonReviewStep ? 'לסקירה ואישור' : 'הבא')}
            <ChevronLeft className="mr-2 h-4 w-4" /> 
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicFoodVisionUploadForm;
