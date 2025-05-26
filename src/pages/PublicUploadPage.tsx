
import React from 'react';
import PublicMultiStepForm from '@/components/public/upload-form/PublicMultiStepForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

const PublicUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <PublicMultiStepForm />
    </NewItemFormProvider>
  );
};

export default PublicUploadPage;
