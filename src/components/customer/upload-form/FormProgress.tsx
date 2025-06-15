
import React from 'react';
import { CheckIcon, ArrowRight } from 'lucide-react';
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
    <div className="w-full px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Mobile Progress Bar */}
        <div className="block md:hidden mb-4">
          <div className="flex items-center justify-between text-white mb-2">
            <span className="text-sm font-medium">שלב {currentStepIndex + 1} מתוך {formSteps.length}</span>
            <span className="text-xs opacity-80">{Math.round(((currentStepIndex + 1) / formSteps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#F3752B] to-[#E6661F] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIndex + 1) / formSteps.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-white text-sm font-semibold">{formSteps[currentStepIndex]?.name}</span>
          </div>
        </div>

        {/* Desktop Progress Steps */}
        <div className="hidden md:flex items-center justify-between" dir="rtl">
          {formSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative group">
                  {/* Step Circle with enhanced design */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ease-in-out shrink-0 shadow-lg relative overflow-hidden",
                      isCompleted 
                        ? "bg-gradient-to-br from-[#F3752B] to-[#E6661F] text-white scale-110 rotate-3" 
                        : isCurrent 
                          ? "bg-gradient-to-br from-[#8B1E3F] to-[#7A1B37] text-white ring-4 ring-white/30 scale-110 animate-pulse" 
                          : "bg-white/20 text-white/60 hover:bg-white/30"
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-6 h-6 animate-bounce" />
                    ) : (
                      <span className="text-lg font-bold">{index + 1}</span>
                    )}
                    
                    {/* Sparkle effect for current step */}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-100%] animate-[slide_2s_ease-in-out_infinite]"></div>
                    )}
                  </div>
                  
                  {/* Step Name with better typography */}
                  <p 
                    className={cn(
                      "mt-3 text-center font-medium transition-all duration-500 ease-in-out px-2 py-1 rounded-lg",
                      isCompleted 
                        ? "text-[#F3752B] bg-white/10 font-bold text-sm shadow-md" 
                        : isCurrent 
                          ? "text-white font-bold text-sm bg-white/20 shadow-lg scale-105" 
                          : "text-white/70 text-xs hover:text-white/90"
                    )}
                  >
                    {step.name}
                  </p>

                  {/* Status indicator */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Enhanced Connector Line */}
                {index < formSteps.length - 1 && (
                  <div className="flex-1 flex items-center justify-center mx-4">
                    <ArrowRight 
                      className={cn(
                        "w-6 h-6 transition-all duration-500 ease-in-out",
                        isCompleted 
                          ? "text-[#F3752B] scale-110" 
                          : "text-white/40"
                      )} 
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FormProgress;
