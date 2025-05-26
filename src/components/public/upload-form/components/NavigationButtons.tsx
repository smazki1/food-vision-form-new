
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
    <div className={cn(
      "flex",
      isFirstStep ? "justify-end" : "justify-between"
    )}>
      {!isFirstStep && (
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isSubmitting}
          className="flex items-center space-x-2 space-x-reverse h-11 px-6"
        >
          <ChevronRight className="w-4 h-4" />
          <span>הקודם</span>
        </Button>
      )}

      <Button
        onClick={onNext}
        disabled={isSubmitting}
        className="flex items-center space-x-2 space-x-reverse h-11 px-6 bg-orange-500 hover:bg-orange-600"
      >
        <span>{isSubmitting ? 'מעבד...' : (isLastStep ? 'לסקירה ואישור' : 'הבא')}</span>
        <ChevronLeft className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NavigationButtons;
