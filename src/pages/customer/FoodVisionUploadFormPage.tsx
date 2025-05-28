
import React from 'react';
import FoodVisionUploadForm from '@/components/customer/upload-form/FoodVisionUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

const FoodVisionUploadFormPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <FoodVisionUploadForm />
    </NewItemFormProvider>
  );
};

export default FoodVisionUploadFormPage;
