import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  isSubmitting: boolean;
}

const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  isSubmitting
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-center">
      <div className={cn(
        "flex gap-4 w-full max-w-md",
        isFirstStep ? "justify-center" : "justify-between"
      )}>
        {!isFirstStep && (
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="flex-1 py-3 px-6 h-auto rounded-full border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/5"
          >
            הקודם
          </Button>
        )}

        <Button
          onClick={onNext}
          disabled={isSubmitting}
          className={`${isFirstStep ? 'w-full' : 'flex-1'} py-3 px-6 h-auto rounded-full bg-[#F3752B] hover:bg-[#F3752B]/90 text-white`}
        >
          {isSubmitting ? 'מעבד...' : (isLastStep ? 'שלח' : 'הבא')}
        </Button>
      </div>
    </div>
  );
};

export default NavigationButtons;
