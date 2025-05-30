import React from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ id: number; name: string }>;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, steps }) => {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Progress Line */}
        <div data-testid="progress-line-background" className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0">
          <div 
            data-testid="progress-line-indicator"
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          />
        </div>
        
        {/* Step Circles */}
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isPending = step.id > currentStep;
          
          return (
            <div key={step.id} data-testid={`step-node-${step.id}`} className="flex flex-col items-center relative z-10">
              {/* Circle */}
              <div
                data-testid={`step-circle-${step.id}`}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 border-4",
                  isCompleted && "bg-emerald-500 border-emerald-500 text-white shadow-lg",
                  isCurrent && "bg-[#F3752B] border-[#F3752B] text-white shadow-lg",
                  isPending && "bg-white border-gray-300 text-gray-400"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.id
                )}
              </div>
              
              {/* Label */}
              <span 
                className={cn(
                  "mt-3 text-sm font-medium text-center transition-colors duration-300 max-w-20",
                  isCompleted && "text-emerald-600",
                  isCurrent && "text-[#F3752B] font-semibold",
                  isPending && "text-gray-400"
                )}
              >
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;
