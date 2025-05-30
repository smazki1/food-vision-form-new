import React from 'react';
import SmartUploaderForm from '@/components/public/smart-uploader/SmartUploaderForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

const SmartUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Submit New Dish</h1>
        <SmartUploaderForm />
      </div>
    </NewItemFormProvider>
  );
};

export default SmartUploadPage; 