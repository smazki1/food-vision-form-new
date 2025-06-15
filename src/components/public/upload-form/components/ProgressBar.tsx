
import React from 'react';
import { CheckIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormStep {
  id: number;
  name: string;
}

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: FormStep[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full bg-gradient-to-r from-[#8B1E3F] to-[#7A1B37] shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Mobile Progress */}
        <div className="block md:hidden">
          <div className="flex items-center justify-between text-white mb-3">
            <span className="text-sm font-semibold">שלב {currentStep} מתוך {totalSteps}</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{Math.round(((currentStep) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#F3752B] to-[#E6661F] rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${((currentStep) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="mt-3 text-center">
            <span className="text-white text-base font-bold">{steps[currentStep - 1]?.name}</span>
          </div>
        </div>

        {/* Desktop Progress Steps */}
        <div className="hidden md:flex items-center justify-between" dir="rtl">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center relative group">
                  {/* Enhanced Step Circle */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ease-in-out shrink-0 shadow-xl relative overflow-hidden border-2",
                      isCompleted 
                        ? "bg-gradient-to-br from-[#F3752B] to-[#E6661F] text-white border-[#F3752B] scale-110 rotate-2" 
                        : isCurrent 
                          ? "bg-gradient-to-br from-white to-gray-100 text-[#8B1E3F] border-white ring-4 ring-white/30 scale-110 shadow-2xl" 
                          : "bg-white/10 text-white/60 border-white/20 hover:bg-white/20"
                    )}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-7 h-7 animate-bounce" />
                    ) : (
                      <span className="text-xl font-bold">{stepNumber}</span>
                    )}
                    
                    {/* Shine effect for current step */}
                    {isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 translate-x-[-100%] animate-[slide_3s_ease-in-out_infinite]"></div>
                    )}
                  </div>
                  
                  {/* Enhanced Step Name */}
                  <p 
                    className={cn(
                      "mt-4 text-center font-semibold transition-all duration-500 ease-in-out px-3 py-2 rounded-xl whitespace-nowrap",
                      isCompleted 
                        ? "text-[#F3752B] bg-white/15 font-bold text-sm shadow-lg backdrop-blur-sm" 
                        : isCurrent 
                          ? "text-white font-bold text-sm bg-white/25 shadow-xl scale-105 backdrop-blur-sm" 
                          : "text-white/70 text-xs hover:text-white/90 hover:bg-white/10"
                    )}
                  >
                    {step.name}
                  </p>

                  {/* Completion Badge */}
                  {isCompleted && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Enhanced Connector with Arrow */}
                {index < steps.length - 1 && (
                  <div className="flex-1 flex items-center justify-center mx-6">
                    <div className={cn(
                      "h-1 flex-1 rounded-full transition-all duration-500 ease-in-out relative overflow-hidden",
                      isCompleted ? "bg-[#F3752B] shadow-lg" : "bg-white/20"
                    )}>
                      {isCompleted && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#F3752B] via-[#FF8A4C] to-[#F3752B] animate-pulse"></div>
                      )}
                    </div>
                    <ArrowLeft 
                      className={cn(
                        "w-5 h-5 mx-2 transition-all duration-500 ease-in-out",
                        isCompleted 
                          ? "text-[#F3752B] scale-110 animate-pulse" 
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

export default ProgressBar;
