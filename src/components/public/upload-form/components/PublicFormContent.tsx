
import React from 'react';
import { PublicStepProps } from '../PublicFoodVisionUploadForm';

interface PublicFormContentProps {
  CurrentStepComponent: React.ComponentType<PublicStepProps>;
  currentStepId: number;
  setErrors: (errors: Record<string, string>) => void;
  clearErrors: () => void;
  errors: Record<string, string>;
  isReviewStep: boolean;
  onFinalSubmit?: () => void;
}

const PublicFormContent: React.FC<PublicFormContentProps> = ({
  CurrentStepComponent,
  currentStepId,
  setErrors,
  clearErrors,
  errors,
  isReviewStep,
  onFinalSubmit
}) => {
  return (
    <main className="flex-grow overflow-y-auto p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
        <CurrentStepComponent 
          key={currentStepId}
          setExternalErrors={setErrors} 
          clearExternalErrors={clearErrors}
          errors={errors}
          onFinalSubmit={isReviewStep ? onFinalSubmit : undefined} 
        />
      </div>
    </main>
  );
};

export default PublicFormContent;
