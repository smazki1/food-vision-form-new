import React, { useState, useEffect } from 'react';
import { useNewItemForm } from '@/contexts/NewItemFormContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUploadDetailsStep from './steps/ImageUploadDetailsStep';
import CategorySelectionStep from './steps/CategorySelectionStep';
import StyleSelectionStep from './steps/StyleSelectionStep';
import PaymentSummaryStep from './steps/PaymentSummaryStep';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { sanitizePathComponent } from '@/utils/pathSanitization';
import { useClientAuth } from '@/hooks/useClientAuth';
import SuccessModal from './components/SuccessModal';
import { triggerMakeWebhook } from '@/lib/triggerMakeWebhook';

const STEPS = [
  { id: 1, name: 'העלאת מנות', component: ImageUploadDetailsStep },
  { id: 2, name: 'בחירת קטגוריה', component: CategorySelectionStep },
  { id: 3, name: 'בחירת סגנון', component: StyleSelectionStep },
  { id: 4, name: 'סיכום ושליחה', component: PaymentSummaryStep }
];

const NewPublicUploadForm: React.FC = () => {
  const { formData, updateFormData, resetFormData } = useNewItemForm();
  const { clientId, authenticating } = useClientAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    resetFormData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        // Existing customers: contact/business info is taken from the authenticated client
        if (formData.dishes.length === 0) {
          newErrors.dishes = 'יש להעלות לפחות מנה אחת';
        }
        formData.dishes.forEach((dish, index) => {
          if (!dish.itemName?.trim()) {
            newErrors[`dish-${index}-name`] = `שם המנה ${index + 1} הוא שדה חובה`;
          }
          if (!dish.itemType) {
            newErrors[`dish-${index}-type`] = `סוג המנה ${index + 1} הוא שדה חובה`;
          }
          if (!dish.description?.trim()) {
            newErrors[`dish-${index}-description`] = `תיאור המנה ${index + 1} הוא שדה חובה`;
          }
          if (dish.referenceImages.length === 0) {
            newErrors[`dish-${index}-images`] = `יש להעלות לפחות תמונה אחת למנה ${index + 1}`;
          }
        });
        break;
      case 2:
        if (!formData.selectedCategory) {
          newErrors.selectedCategory = 'יש לבחור קטגוריה';
        }
        break;
      case 3:
        if (!formData.selectedStyle && !formData.customStyle) {
          newErrors.selectedStyle = 'יש לבחור סגנון עיצוב';
        }
        break;
      case 4:
        // Step 4 is payment step - no additional validation needed
        // All validation was done in previous steps
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    } else {
      toast.error('אנא תקנו את השגיאות המסומנות');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called, validating step 4...');
    console.log('Current formData:', formData);
    
    if (validateStep(4)) {
      console.log('Step 4 validation passed, starting submission process...');
      setIsSubmitting(true);
      try {
        console.log('Submitting public form data:', formData);
        if (authenticating) {
          throw new Error('נדרש להתחבר למערכת (טוען פרטי לקוח)');
        }
        if (!clientId) {
          throw new Error('לא נמצא מזהה לקוח פעיל. אנא התחבר/י שוב.');
        }
        
        // Process first dish silently
        const dish = formData.dishes[0];
        console.log('Processing dish:', dish);
        
        // Upload files first
        const uploadedImageUrls: string[] = [];
        if (dish.referenceImages && dish.referenceImages.length > 0) {
          console.log(`Uploading ${dish.referenceImages.length} images...`);
          for (const file of dish.referenceImages) {
            const fileExtension = file.name.split('.').pop();
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            const sanitizedItemType = sanitizePathComponent(dish.itemType);
            const filePath = `${clientId}/${sanitizedItemType}/${uniqueFileName}`;
            
            console.log(`Uploading file to path: ${filePath}`);
            const { error: uploadError } = await supabase.storage
              .from('food-vision-images')
              .upload(filePath, file);
              
            if (uploadError) {
              console.error('Upload error:', uploadError);
              throw new Error(`שגיאה בהעלאת קובץ: ${uploadError.message}`);
            }
            
            const { data: publicUrlData } = supabase.storage
              .from('food-vision-images')
              .getPublicUrl(filePath);
              
            if (publicUrlData?.publicUrl) {
              uploadedImageUrls.push(publicUrlData.publicUrl);
              console.log('Successfully uploaded image:', publicUrlData.publicUrl);
            }
          }
        }

        console.log('All images uploaded successfully. Total URLs:', uploadedImageUrls.length);

        // Create submission linked to client
        const submissionId = uuidv4();
        console.log('Creating submission with ID:', submissionId);
        const submissionData = {
          submission_id: submissionId,
          client_id: clientId,
          item_name_at_submission: dish.itemName,
          item_type: dish.itemType,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: uploadedImageUrls,
          uploaded_at: new Date().toISOString(),
          description: dish.description || null,
          category: formData.selectedCategory || null,
          selected_style: formData.selectedStyle || null,
          design_notes: formData.designNotes || null,
          custom_style_data: formData.customStyle ? JSON.stringify(formData.customStyle) : null
        };
        
        console.log('Submission data to insert:', submissionData);
        const { error: submissionError } = await supabase
          .from('customer_submissions')
          .insert(submissionData);

        if (submissionError) {
          console.error('Submission error:', submissionError);
          throw new Error(`Database error: ${submissionError.message}`);
        }

        console.log('Submission created successfully!');
        // Fire webhook (non-blocking)
        try {
          triggerMakeWebhook({
            submissionTimestamp: new Date().toISOString(),
            isAuthenticated: true,
            clientId,
            restaurantName: formData.restaurantName || '',
            submitterName: formData.submitterName,
            contactEmail: formData.email,
            contactPhone: formData.phone,
            itemName: dish.itemName,
            itemType: dish.itemType,
            description: dish.description,
            specialNotes: dish.specialNotes,
            uploadedImageUrls,
            category: formData.selectedCategory || null,
            ingredients: null,
            sourceForm: 'enhanced-customer-upload-form'
          });
        } catch (e) {
          console.warn('Webhook send failed (non-blocking):', e);
        }

        // Show success modal
        setShowSuccess(true);
        // Clear form after success
        resetFormData();
        console.log('Form submitted successfully');
        
      } catch (error: any) {
        console.error('Error in handleSubmit:', error);
        toast.error(`שגיאה: ${error.message || 'אנא נסו שוב'}`);
        setIsSubmitting(false);
      }
    } else {
      console.log('Step 4 validation failed. Current errors:', errors);
      console.log('Form data that failed validation:', formData);
      toast.error('אנא תקנו את השגיאות המסומנות');
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Mobile-Optimized Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="text-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#8B1E3F] mb-2">חבילת טעימות</h1>
            <p className="text-gray-600 text-base sm:text-lg px-2">10-12 תמונות מעוצבות מקצועיות תוך 48 שעות</p>
          </div>
          
          {/* Mobile-Optimized Progress Bar */}
          <div className="relative">
            <div className="flex items-center justify-center overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-base sm:text-lg font-bold transition-all duration-300 shadow-lg",
                      currentStep >= step.id 
                        ? 'bg-gradient-to-r from-[#8B1E3F] to-[#A52A44] text-white scale-110 shadow-[#8B1E3F]/30' 
                        : currentStep === step.id - 1
                        ? 'bg-gradient-to-r from-[#F3752B] to-[#FF8B47] text-white'
                        : 'bg-white text-gray-400 border-2 border-gray-200'
                    )}>
                      {currentStep > step.id ? '✓' : step.id}
                    </div>
                    <span className={cn(
                      "mt-2 sm:mt-3 text-xs sm:text-sm font-semibold transition-colors text-center max-w-16 sm:max-w-20 leading-tight",
                      currentStep >= step.id 
                        ? 'text-[#8B1E3F]' 
                        : 'text-gray-500'
                    )}>
                      {step.name}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      "w-8 sm:w-16 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-300",
                      currentStep > step.id 
                        ? 'bg-gradient-to-r from-[#8B1E3F] to-[#A52A44]' 
                        : 'bg-gray-200'
                    )} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-4 sm:p-8 md:p-16">
            {currentStep === 4 ? (
              <PaymentSummaryStep 
                errors={errors}
                clearErrors={() => setErrors({})}
                onPrevious={handlePrevious}
                onSubmit={handleSubmit}
              />
            ) : (
            <CurrentStepComponent 
              errors={errors}
              clearErrors={() => setErrors({})}
            />
            )}
          </div>

          {/* Mobile-Optimized Navigation */}
          {currentStep < 4 && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-8 md:px-16 py-4 sm:py-8">
              <div className="flex justify-center items-center gap-3 sm:gap-6">
                {currentStep > 1 && (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 border-2 border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F] hover:text-white transition-all duration-300 rounded-xl font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    הקודם
                  </Button>
                )}
                
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="flex items-center gap-2 sm:gap-3 px-6 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-[#F3752B] to-[#FF8B47] hover:from-[#E56B26] hover:to-[#F3752B] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
                >
                  הבא
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal after submission */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
};

export default NewPublicUploadForm;
