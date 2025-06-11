import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Plus } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

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
  const { originalLeadId } = useClientAuth();
  const { resetFormData } = useNewItemForm();
  const isLastStep = currentStepId === formSteps[formSteps.length - 1].id;
  const isFirstStep = currentStepId === formSteps[0].id && clientId;
  const shouldShowPrevious = formSteps.length > 1 && !isFirstStep;
  
  // Check if user is a lead (they shouldn't see add another dish)
  const isLead = !!originalLeadId;
  
  // Show add another dish button on step 2 (upload details) for customers who are not leads
  const shouldShowAddAnotherDish = currentStepId === 2 && clientId && !isLead;

  const handleAddAnotherDish = () => {
    // Reset form data and stay on step 2
    if (resetFormData) {
      resetFormData();
    }
  };

  return (
    <div className={cn(
      "mt-8 flex flex-col items-center gap-4",
      formSteps.length === 1 || isFirstStep ? "justify-center" : "justify-center"
    )}>
      {/* Add Another Dish Button - Red, appears only on step 2 for non-lead customers */}
      {shouldShowAddAnotherDish && (
        <Button 
          onClick={handleAddAnotherDish}
          disabled={isSubmitting || isCreatingClient}
          className="min-w-[200px] py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          הוספת מנה נוספת
        </Button>
      )}

      {/* Navigation Buttons Row */}
      <div className={cn(
        "flex justify-center gap-4",
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
    </div>
  );
};

export default FormNavigationButtons;
