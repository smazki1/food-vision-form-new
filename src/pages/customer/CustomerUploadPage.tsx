import React from 'react';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import CustomerUploadForm from '@/components/customer/upload-form/CustomerUploadForm';

const CustomerUploadPage: React.FC = () => {
  return (
    <NewItemFormProvider>
      <CustomerUploadForm />
    </NewItemFormProvider>
  );
};

export default CustomerUploadPage; 