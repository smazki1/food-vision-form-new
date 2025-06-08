import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { Client } from '@/types/client';

interface ClientPaymentStatusProps {
  clientId: string;
  client: Client;
}

export const ClientPaymentStatus: React.FC<ClientPaymentStatusProps> = ({
  clientId,
  client
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          סטטוס תשלומים
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center text-gray-500 py-8">
          <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg">סטטוס תשלומים</p>
          <p className="text-sm mt-2">רכיב זה יושלם בקרוב - יכלול מעקב תשלומים, חשבוניות והתראות</p>
        </div>
      </CardContent>
    </Card>
  );
}; 