
import React from 'react';
import FormProgress from '@/components/customer/upload-form/FormProgress';

interface PublicFormHeaderProps {
  formSteps: Array<{ id: number; name: string }>;
  currentStepId: number;
}

const PublicFormHeader: React.FC<PublicFormHeaderProps> = ({ formSteps, currentStepId }) => {
  return (
    <div className="relative p-4 bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
          העלאת פריט חדש
        </h1>
        <FormProgress formSteps={formSteps} currentStepId={currentStepId} />
      </div>
    </div>
  );
};

export default PublicFormHeader;
