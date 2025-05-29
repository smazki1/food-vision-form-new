
import React from 'react';
import PublicFoodVisionUploadForm from '@/components/public/upload-form/PublicFoodVisionUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import { ClientAuthProvider } from '@/providers/ClientAuthProvider';

const FoodVisionUploadFormPage: React.FC = () => {
  return (
    <ClientAuthProvider>
      <NewItemFormProvider>
        <PublicFoodVisionUploadForm />
      </NewItemFormProvider>
    </ClientAuthProvider>
  );
};

export default FoodVisionUploadFormPage;
