import React from 'react';
import { CheckIcon } from 'lucide-react'; // Using CheckIcon for completed steps

interface FormStep {
  id: number;
  name: string;
  // Add other properties if needed from your formSteps definition
}

interface FormProgressProps {
  currentStepId: number;
  formSteps: FormStep[];
  // totalSteps: number; // totalSteps can be derived from formSteps.length
}

const FormProgress: React.FC<FormProgressProps> = ({ currentStepId, formSteps }) => {
  const currentStepIndex = formSteps.findIndex(step => step.id === currentStepId);

  return (
    <div className="flex items-center justify-center w-full px-4 py-3 md:px-8" dir="rtl">
      {formSteps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        // const isFuture = index > currentStepIndex; // Not explicitly used for styling different future steps now

        let circleClasses = "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ease-in-out shrink-0";
        let textClasses = "mt-2 text-xs md:text-sm text-center whitespace-nowrap";
        let lineClasses = "flex-1 h-0.5 transition-all duration-300 ease-in-out";

        if (isCompleted) {
          circleClasses += " bg-green-500 border-green-500 text-white";
          textClasses += " text-green-600 font-medium";
          lineClasses += " bg-green-500";
        } else if (isCurrent) {
          circleClasses += " bg-primary border-primary text-primary-foreground";
          textClasses += " text-primary font-semibold";
          lineClasses += " bg-gray-300"; // Line to next step (if any) is pending
        } else { // isFuture
          circleClasses += " bg-gray-100 border-gray-300 text-gray-400";
          textClasses += " text-muted-foreground";
          lineClasses += " bg-gray-300";
        }

        const displayStepNumber = index + 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={circleClasses}>
                {isCompleted ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : <span className="text-sm md:text-base">{displayStepNumber}</span>}
              </div>
              <p className={textClasses}>{step.name}</p>
            </div>
            {index < formSteps.length - 1 && (
              <div className={`mx-2 md:mx-4 ${lineClasses}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default FormProgress; 