
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
      toast.success('ההזמנה נשלחה בהצלחה!');
      // Reset form after successful submission
      resetFormData();
      setCurrentStep(1);
      setErrors({});
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
            <CurrentStepComponent 
              errors={errors}
              clearErrors={() => setErrors({})}
            />

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

            {/* Final Submit Button */}
            {currentStep === 4 && (
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-gray-100">
                <Button
                  onClick={handlePrevious}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
                >
                  <ChevronRight className="w-4 h-4" />
                  הקודם
                </Button>
                
                <Button
                  onClick={handleSubmit}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                >
                  הזמן עכשיו - 249₪
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
