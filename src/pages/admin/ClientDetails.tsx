import React from 'react';
import { useParams } from 'react-router-dom';
import { ClientDetailPanel } from '@/components/admin/client-details/ClientDetailPanel';

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();

  if (!clientId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">שגיאה</h1>
          <p className="text-gray-600 mt-2">מזהה לקוח לא נמצא</p>
      </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ClientDetailPanel 
        clientId={clientId} 
        onClose={() => window.history.back()} 
      />
    </div>
  );
};

export default ClientDetails;
