import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, CheckCircle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicFormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void; // Renamed from finalSubmitAction for clarity
  isLoading?: boolean;
  isNextDisabled?: boolean; // To disable next/submit based on validation
  nextButtonText?: string; // e.g., "הבא" or "שלח ואשר"
  finalSubmitButtonText?: string; // e.g., "שלח ואשר סופית" - used by ReviewStep
  showSubmitButtonOnLastStep?: boolean; // True if last step is not the review step
  isReviewStep?: boolean; // True if the current step is the review step (which has its own submit button)
}

const PublicFormNavigation: React.FC<PublicFormNavigationProps> = ({ 
  currentStep, 
  totalSteps, 
  onNext, 
  onBack, 
  onSubmit, // This will be the main submit function
  isLoading,
  isNextDisabled,
  nextButtonText = 'הבא', // Default text
  finalSubmitButtonText, // This is for the review step's specific button, handled there
  showSubmitButtonOnLastStep,
  isReviewStep
}) => {
  const showBackButton = currentStep > 0;
  const isLastNonReviewStep = currentStep === totalSteps - 1 && !isReviewStep;

  // If it's the review step, its own submit button is rendered within its component.
  // So, this navigation component might only show a "Back" button or nothing if it's also the first step (though unlikely for review).
  if (isReviewStep) {
    return (
      <div className={cn("flex mt-8 pt-6 border-t border-gray-200", showBackButton ? "justify-between" : "justify-end")} dir="rtl">
        {showBackButton && (
          <Button onClick={onBack} variant="outline" size="lg" className="text-gray-700 border-gray-300 hover:bg-gray-100">
            <ArrowRight className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            הקודם
          </Button>
        )}
        {/* No "Next" or "Submit" button here for the review step, as it has its own */}
      </div>
    );
  }
  
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200" dir="rtl">
      {showBackButton ? (
        <Button onClick={onBack} variant="outline" size="lg" disabled={isLoading} className="text-gray-700 border-gray-300 hover:bg-gray-100">
          <ArrowRight className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
          הקודם
        </Button>
      ) : <div /> // Placeholder to keep spacing
      }

      <Button 
        onClick={isLastNonReviewStep || showSubmitButtonOnLastStep ? onSubmit : onNext} 
        size="lg" 
        disabled={isLoading || isNextDisabled}
        className={cn(
          "text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-150 ease-in-out",
          (isLastNonReviewStep || showSubmitButtonOnLastStep) 
            ? "bg-[#8B1E3F] hover:bg-[#7A1B37]" // Burgundy for final submit
            : "bg-teal-500 hover:bg-teal-600" // Teal for Next
        )}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 rtl:ml-3 rtl:-mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            מעבד...
          </>
        ) : (
          <>
            {(isLastNonReviewStep || showSubmitButtonOnLastStep) ? 
              (nextButtonText && nextButtonText !== 'הבא' ? nextButtonText : 'שלח ואשר') : 
              nextButtonText}
            {!(isLastNonReviewStep || showSubmitButtonOnLastStep) && <ArrowLeft className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />}
            {(isLastNonReviewStep || showSubmitButtonOnLastStep) && <Send className="ml-2 h-5 w-5 rtl:mr-2 rtl:ml-0" />}
          </>
        )}
      </Button>
    </div>
  );
};

export default PublicFormNavigation; 