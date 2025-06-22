
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

const STEPS = [
  { id: 1, name: 'העלאת מנות', component: ImageUploadDetailsStep },
  { id: 2, name: 'בחירת קטגוריה', component: CategorySelectionStep },
  { id: 3, name: 'בחירת סגנון', component: StyleSelectionStep },
  { id: 4, name: 'תשלום וסיכום', component: PaymentSummaryStep }
];

const NewPublicUploadForm: React.FC = () => {
  const { formData, updateFormData, resetFormData } = useNewItemForm();
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    resetFormData();
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.restaurantName?.trim()) {
          newErrors.restaurantName = 'שם העסק הוא שדה חובה';
        }
        if (!formData.submitterName?.trim()) {
          newErrors.submitterName = 'שם איש הקשר הוא שדה חובה';
        }
        if (!formData.phone?.trim()) {
          newErrors.phone = 'מספר טלפון הוא שדה חובה';
        }
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
    if (validateStep(4)) {
      try {
        console.log('Submitting public form data:', formData);
        
        toast.info('מעבד את ההגשה...');
        
        // Process first dish
        const dish = formData.dishes[0];
        
        // Upload files first
        const uploadedImageUrls: string[] = [];
        if (dish.referenceImages && dish.referenceImages.length > 0) {
          for (const file of dish.referenceImages) {
            const fileExtension = file.name.split('.').pop();
            const uniqueFileName = `${uuidv4()}.${fileExtension}`;
            const sanitizedItemType = sanitizePathComponent(dish.itemType);
            const filePath = `public-uploads/${Date.now()}/${sanitizedItemType}/${uniqueFileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('food-vision-images')
              .upload(filePath, file);
              
            if (uploadError) {
              throw new Error(`שגיאה בהעלאת קובץ: ${uploadError.message}`);
            }
            
            const { data: publicUrlData } = supabase.storage
              .from('food-vision-images')
              .getPublicUrl(filePath);
              
            if (publicUrlData?.publicUrl) {
              uploadedImageUrls.push(publicUrlData.publicUrl);
            }
          }
        }

        // Check if client exists or create new one
        let clientId: string;
        
        // Check existing client
        const { data: existingClient } = await supabase
          .from('clients')
          .select('client_id, current_package_id, remaining_servings, remaining_images')
          .eq('restaurant_name', formData.restaurantName)
          .single();
          
        if (existingClient) {
          clientId = existingClient.client_id;
          console.log('Using existing client:', clientId);
          
          // If existing client doesn't have a package, assign trial package
          if (!existingClient.current_package_id) {
            const trialPackageId = '28fc2f96-5742-48f3-8c77-c9766752ff6b'; // חבילת ניסיון 249₪
            
            const { error: updateError } = await supabase
              .from('clients')
              .update({
                current_package_id: trialPackageId,
                remaining_servings: 3,
                remaining_images: 12,
                payment_amount_ils: 249.00,
                payment_status: 'paid'
              })
              .eq('client_id', clientId);
              
            if (updateError) {
              console.error('Error assigning trial package to existing client:', updateError);
            } else {
              console.log('Assigned trial package to existing client:', clientId);
            }
          }
        } else {
          // Create new client with placeholder user_auth_id and automatic trial package assignment
          clientId = uuidv4();
          const placeholderAuthId = uuidv4(); // Placeholder since we don't have auth user
          const trialPackageId = '28fc2f96-5742-48f3-8c77-c9766752ff6b'; // חבילת ניסיון 249₪
          
          const { error: clientError } = await supabase
            .from('clients')
            .insert({
              client_id: clientId,
              user_auth_id: placeholderAuthId,
              restaurant_name: formData.restaurantName,
              contact_name: formData.submitterName,
              email: formData.email || 'placeholder@email.com', // email is required
              phone: formData.phone || 'N/A',
              current_package_id: trialPackageId,
              remaining_servings: 3,
              remaining_images: 12,
              payment_amount_ils: 249.00,
              payment_status: 'paid'
            });
            
          if (clientError) {
            console.error('Client creation error:', clientError);
            throw new Error(`Client creation error: ${clientError.message}`);
          }
          console.log('Created new client with trial package:', clientId);
        }

        // Create submission linked to client
        const submissionId = uuidv4();
        const { error: submissionError } = await supabase
          .from('customer_submissions')
          .insert({
            submission_id: submissionId,
            client_id: clientId,
            item_name_at_submission: dish.itemName,
            item_type: dish.itemType,
            submission_status: 'ממתינה לעיבוד',
            original_image_urls: uploadedImageUrls,
            uploaded_at: new Date().toISOString(),
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || null,
            phone: formData.phone,
            description: dish.description || null
          });

        if (submissionError) {
          console.error('Submission error:', submissionError);
          throw new Error(`Database error: ${submissionError.message}`);
        }

        toast.success('ההזמנה נשלחה בהצלחה! חבילת הניסיון 249₪ הוקצתה אוטומטית');
        console.log('Form submitted successfully');
        
        // Clear form data
        resetFormData();
        
        // Redirect to thank you page
        setTimeout(() => {
          window.location.href = '/thank-you';
        }, 1000);
        
      } catch (error: any) {
        console.error('Error:', error);
        toast.error('אנא נסו שוב');
      }
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  currentStep >= step.id 
                    ? 'bg-[#8B1E3F] text-white' 
                    : 'bg-gray-200 text-gray-600'
                )}>
                  {step.id}
                </div>
                <span className={cn(
                  "mr-2 text-sm font-medium transition-colors",
                  currentStep >= step.id 
                    ? 'text-[#8B1E3F]' 
                    : 'text-gray-500'
                )}>
                  {step.name}
                </span>
                {index < STEPS.length - 1 && (
                  <ChevronLeft className="h-4 w-4 text-gray-400 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 md:p-12">
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

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                {currentStep > 1 ? (
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-3 border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
                  >
                    <ChevronRight className="w-4 h-4" />
                    הקודם
                  </Button>
                ) : <div />}
                
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 bg-[#F3752B] hover:bg-orange-600 text-white"
                >
                  הבא
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default NewPublicUploadForm;
