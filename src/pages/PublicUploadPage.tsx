
import React from 'react';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import NewPublicUploadForm from '@/components/public/upload-form/NewPublicUploadForm';

const PublicUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <NewPublicUploadForm />
    </NewItemFormProvider>
  );
};

export default PublicUploadPage;
