import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface FormNavigationButtonsProps {
  formSteps: any[];
  currentStepId: number;
  clientId: string | null;
  isSubmitting: boolean;
  isCreatingClient: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMainSubmit: () => void;
}

const FormNavigationButtons: React.FC<FormNavigationButtonsProps> = ({
  formSteps,
  currentStepId,
  clientId,
  isSubmitting,
  isCreatingClient,
  onPrevious,
  onNext,
  onMainSubmit
}) => {
  const isLastStep = currentStepId === formSteps[formSteps.length - 1].id;
  const isFirstStep = currentStepId === formSteps[0].id && clientId;
  const shouldShowPrevious = formSteps.length > 1 && !isFirstStep;

  return (
    <div className={cn(
      "mt-8 flex justify-center gap-4",
      formSteps.length === 1 || isFirstStep ? "justify-center" : "justify-center"
    )}>
      {shouldShowPrevious && (
        <Button 
          variant="outline"
          onClick={onPrevious} 
          disabled={isSubmitting || isCreatingClient}
          className="min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full border-[#8B1E3F] text-[#8B1E3F] hover:bg-[#8B1E3F]/10"
        >
          הקודם
        </Button>
      )}
      <Button 
        onClick={isLastStep ? onMainSubmit : onNext} 
        disabled={isSubmitting || isCreatingClient}
        className={cn("min-w-[120px] md:min-w-[140px] py-2 md:py-3 rounded-full",
          isLastStep 
          ? "bg-[#8B1E3F] hover:bg-[#8B1E3F]/90" 
          : "bg-[#F3752B] hover:bg-[#F3752B]/90"
        )}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            שולח...
          </>
        ) : 
          isLastStep ? 
            'שלח הגשה' : 
            (currentStepId === 1 && !clientId) ? 'שמור והמשך' : 'הבא'
        }
      </Button>
    </div>
  );
};

export default FormNavigationButtons;
