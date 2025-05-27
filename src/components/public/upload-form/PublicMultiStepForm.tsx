import React, { useState } from 'react';
import FormProgress from './components/FormProgress';
import CombinedDetailsStep from './steps/CombinedDetailsStep';
import ImageUploadStep from './steps/ImageUploadStep';
import ReviewSubmitStep from './steps/ReviewSubmitStep';
import NavigationButtons from './components/NavigationButtons';
import { useFormValidation } from './hooks/useFormValidation';
import { usePublicFormSubmission } from '@/hooks/usePublicFormSubmission';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

const formSteps = [
  { id: 1, name: 'פרטי המסעדה והפריט' },
  { id: 2, name: 'העלאת תמונות' },
  { id: 3, name: 'סקירה ואישור' }
];

const stepComponents = {
  1: CombinedDetailsStep,
  2: ImageUploadStep,
  3: ReviewSubmitStep
};

const PublicMultiStepForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { validateStep, errors, clearErrors } = useFormValidation();
  const { submitForm, isSubmitting } = usePublicFormSubmission();
  const { formData } = useNewItemForm();

  const handleNext = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid && currentStep < formSteps.length) {
      setCurrentStep(prev => prev + 1);
      clearErrors();
      window.scrollTo(0, 0);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      clearErrors();
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    const success = await submitForm(formData);
    if (success) {
      setCurrentStep(1);
    }
  };

  const CurrentStepComponent = stepComponents[currentStep as keyof typeof stepComponents];

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 md:py-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#8B1E3F] text-white p-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              העלאת פריט חדש
            </h1>
            <p className="text-white/80 text-center text-sm md:text-base">
              מלאו את הפרטים הנדרשים להעלאת הפריט שלכם
            </p>
          </div>

          {/* Progress */}
          <div className="p-6 border-b border-gray-200">
            <FormProgress 
              formSteps={formSteps} 
              currentStepId={currentStep} 
            />
          </div>

          {/* Step Content */}
          <div className="p-6 min-h-[400px]">
            <CurrentStepComponent 
              errors={errors}
              onNext={currentStep === 3 ? handleSubmit : handleNext}
              isSubmitting={isSubmitting}
              onFinalSubmit={currentStep === 3 ? handleSubmit : undefined}
            />
          </div>

          {/* Navigation */}
          {currentStep < 3 && (
            <div className="p-6 border-t border-gray-200 flex justify-center">
              <div className="flex gap-4 w-full max-w-md">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevious}
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-6 rounded-full border border-[#8B1E3F] text-[#8B1E3F] font-medium hover:bg-[#8B1E3F]/5 transition-colors disabled:opacity-50"
                  >
                    הקודם
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={`${currentStep === 1 ? 'w-full' : 'flex-1'} py-3 px-6 rounded-full bg-[#F3752B] text-white font-medium hover:bg-[#F3752B]/90 transition-colors disabled:opacity-50`}
                >
                  {isSubmitting ? 'מעבד...' : 'הבא'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicMultiStepForm;
