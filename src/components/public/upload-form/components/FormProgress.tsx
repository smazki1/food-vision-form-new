import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStep {
  id: number;
  name: string;
}

interface FormProgressProps {
  formSteps: FormStep[];
  currentStepId: number;
}

const FormProgress: React.FC<FormProgressProps> = ({ formSteps, currentStepId }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {formSteps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                  step.id < currentStepId
                    ? "bg-[#F3752B] text-white"
                    : step.id === currentStepId
                    ? "bg-[#8B1E3F] text-white ring-2 ring-[#8B1E3F]/30"
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {step.id < currentStepId ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  step.id
                )}
              </div>
              
              {/* Step Name */}
              <span
                className={cn(
                  "text-xs font-medium mt-2 text-center transition-colors duration-200",
                  step.id < currentStepId
                    ? "text-[#F3752B]"
                    : step.id === currentStepId
                    ? "text-[#8B1E3F]"
                    : "text-gray-400"
                )}
              >
                {step.name}
              </span>
            </div>

            {/* Connector Line */}
            {index < formSteps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-2 transition-colors duration-200",
                  step.id < currentStepId
                    ? "bg-[#F3752B]"
                    : "bg-gray-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-[#F3752B] h-1 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${((currentStepId - 1) / (formSteps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default FormProgress;
