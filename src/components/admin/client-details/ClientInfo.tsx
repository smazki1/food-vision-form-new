
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ClientInfoProps {
  client: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
    created_at: string;
  };
}

export const ClientInfo: React.FC<ClientInfoProps> = ({ client }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטי לקוח</CardTitle>
        <CardDescription>
          נוצר בתאריך {formatDate(client.created_at)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-sm">שם מסעדה</h3>
            <p>{client.restaurant_name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm">איש קשר</h3>
            <p>{client.contact_name}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm">טלפון</h3>
            <p>{client.phone}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm">אימייל</h3>
            <p>{client.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
