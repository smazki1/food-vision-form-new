
import React from 'react';
import PublicFoodVisionUploadForm from '@/components/public/upload-form/PublicFoodVisionUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

const FoodVisionUploadFormPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <PublicFoodVisionUploadForm />
    </NewItemFormProvider>
  );
};

export default FoodVisionUploadFormPage;
