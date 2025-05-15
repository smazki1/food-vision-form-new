
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import { Client } from "@/types/client";

interface ClientInfoProps {
  client: Client;
  onEdit?: () => void;
}

export const ClientInfo: React.FC<ClientInfoProps> = ({ client, onEdit }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "פעיל":
        return "success";
      case "לא פעיל":
        return "destructive";
      case "בהמתנה":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>פרטי לקוח</CardTitle>
            <CardDescription>
              נוצר בתאריך {formatDate(client.created_at)}
            </CardDescription>
          </div>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
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
          <div>
            <h3 className="font-semibold text-sm">סטטוס</h3>
            <Badge variant={getStatusBadgeVariant(client.client_status) as any}>
              {client.client_status}
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold text-sm">מנות שנותרו</h3>
            <p>{client.remaining_servings}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm">פעילות אחרונה</h3>
            <p>{formatDate(client.last_activity_at)}</p>
          </div>
          {client.internal_notes && (
            <div>
              <h3 className="font-semibold text-sm">הערות פנימיות</h3>
              <p className="text-muted-foreground">{client.internal_notes}</p>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">חשבון משתמש</h3>
            <p>
              {client.user_auth_id ? (
                <Badge variant="outline" className="bg-green-50">קיים</Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50">לא קיים</Badge>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
