import React from 'react';
import PublicUploadForm from '@/components/public/PublicUploadForm'; // Assuming alias for components

const PublicUploadPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8 flex flex-col justify-center items-center">
      <PublicUploadForm />
    </div>
  );
};

export default PublicUploadPage; 