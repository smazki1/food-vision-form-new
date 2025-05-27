import React from 'react';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStep {
  id: number;
  name: string;
}

interface FormProgressProps {
  currentStepId: number;
  formSteps: FormStep[];
}

const FormProgress: React.FC<FormProgressProps> = ({ currentStepId, formSteps }) => {
  const currentStepIndex = formSteps.findIndex(step => step.id === currentStepId);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2" dir="rtl">
        {formSteps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                {/* Step Circle */}
                <div
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shrink-0",
                    isCompleted 
                      ? "bg-[#F3752B] text-white" 
                      : isCurrent 
                        ? "bg-[#8B1E3F] text-white ring-2 ring-[#8B1E3F]/30" 
                        : "bg-gray-200 text-gray-500"
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <span className="text-sm md:text-base">{index + 1}</span>
                  )}
                </div>
                
                {/* Step Name */}
                <p 
                  className={cn(
                    "mt-2 text-xs md:text-sm text-center whitespace-nowrap transition-all duration-300 ease-in-out",
                    isCompleted 
                      ? "text-[#F3752B] font-medium" 
                      : isCurrent 
                        ? "text-white font-semibold" 
                        : "text-gray-300"
                  )}
                >
                  {step.name}
                </p>
              </div>
              
              {/* Connector Line */}
              {index < formSteps.length - 1 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-2 md:mx-4 transition-all duration-300 ease-in-out",
                    isCompleted 
                      ? "bg-[#F3752B]" 
                      : "bg-gray-300"
                  )} 
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Progress Bar (Optional) */}
      <div className="w-full bg-gray-200 rounded-full h-1 mt-1 hidden md:block">
        <div
          className="bg-[#F3752B] h-1 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStepIndex) / (formSteps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default FormProgress; 