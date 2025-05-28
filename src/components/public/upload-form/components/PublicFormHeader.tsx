
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PublicFormHeaderProps {
  formSteps: Array<{ id: number; name: string }>;
  currentStepId: number;
}

const PublicFormHeader: React.FC<PublicFormHeaderProps> = ({
  formSteps,
  currentStepId
}) => {
  return (
    <div className="w-full p-4 bg-[#8B1E3F] shadow-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          {formSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                currentStepId >= step.id ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
              )}>
                {step.id}
              </div>
              <span className={cn(
                "mr-2 text-sm",
                currentStepId >= step.id ? 'text-white font-medium' : 'text-gray-300'
              )}>
                {step.name}
              </span>
              {index < formSteps.length - 1 && (
                <ChevronLeft className="h-4 w-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicFormHeader;
