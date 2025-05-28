
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
          className="flex items-center bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-full"
        >
          <ChevronRight className="ml-2 h-4 w-4" /> 
          הקודם
        </Button>
      )}
      
      {!isLastStep && (
        <Button 
          onClick={onNext} 
          disabled={isSubmitting}
          className="flex items-center bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 hover:border-emerald-600 px-6 py-3 rounded-full"
        >
          {isSubmitting ? 'מעבד...' : 'הבא'}
          <ChevronLeft className="mr-2 h-4 w-4" /> 
        </Button>
      )}
    </div>
  );
};

export default PublicFormNavigation;
