import React from 'react';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import ClientUnifiedUploadForm from '@/components/customer/unified-upload-form/ClientUnifiedUploadForm';

const NewClientUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <ClientUnifiedUploadForm />
    </NewItemFormProvider>
  );
};

export default NewClientUploadPage; 