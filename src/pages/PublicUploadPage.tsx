// src/pages/PublicUploadPage.tsx - TEMPORARY DEBUG
import React from 'react';
import PublicFoodVisionUploadForm from '@/components/public/upload-form/PublicFoodVisionUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

const PublicUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      {/* We might need a different layout or wrapper here later */}
      <div className="container mx-auto p-4">
        <PublicFoodVisionUploadForm />
      </div>
    </NewItemFormProvider>
  );
};

export default PublicUploadPage; 