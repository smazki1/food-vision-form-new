
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicFormNavigationProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  isSubmitting: boolean;
  currentStepId: number;
  onNext: () => void;
  onPrevious: () => void;
}

const PublicFormNavigation: React.FC<PublicFormNavigationProps> = ({
  isFirstStep,
  isLastStep,
  isSubmitting,
  currentStepId,
  onNext,
  onPrevious
}) => {
  return (
    <div className={cn(
      "flex mt-8 pt-6 border-t",
      isFirstStep ? "justify-end" : "justify-between"
    )}>
      {!isFirstStep && (
        <Button 
          variant="outline" 
          onClick={onPrevious} 
          disabled={isSubmitting}
          className="flex items-center bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900"
        >
          <ChevronRight className="ml-2 h-4 w-4" /> 
          הקודם
        </Button>
      )}
      <Button 
        onClick={onNext} 
        disabled={isSubmitting}
        className="flex items-center bg-orange-500 hover:bg-orange-600 text-white border-orange-500 hover:border-orange-600"
      >
        {isSubmitting ? 'מעבד...' : (currentStepId === 3 ? 'לסקירה ואישור' : 'הבא')}
        <ChevronLeft className="mr-2 h-4 w-4" /> 
      </Button>
    </div>
  );
};

export default PublicFormNavigation;
