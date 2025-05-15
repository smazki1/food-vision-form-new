
import React from "react";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import ClientsPackageName from "./ClientsPackageName";

interface ClientsTableProps {
  clients: Client[];
  isLoading: boolean;
}

const ClientsTable: React.FC<ClientsTableProps> = ({ clients, isLoading }) => {
  const navigate = useNavigate();

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

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם מסעדה</TableHead>
              <TableHead>איש קשר</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>חבילה נוכחית</TableHead>
              <TableHead>מנות שנותרו</TableHead>
              <TableHead>תאריך הצטרפות</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[40px]" /></TableCell>
                <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם מסעדה</TableHead>
              <TableHead>איש קשר</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>חבילה נוכחית</TableHead>
              <TableHead>מנות שנותרו</TableHead>
              <TableHead>תאריך הצטרפות</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={8} className="h-24">
                <EmptyState
                  title="לא נמצאו לקוחות"
                  description="לא נמצאו לקוחות התואמים לחיפוש שלך."
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם מסעדה</TableHead>
            <TableHead>איש קשר</TableHead>
            <TableHead>טלפון</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>חבילה נוכחית</TableHead>
            <TableHead>מנות שנותרו</TableHead>
            <TableHead>תאריך הצטרפות</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.client_id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{client.restaurant_name}</TableCell>
              <TableCell>{client.contact_name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(client.client_status) as any}>
                  {client.client_status}
                </Badge>
              </TableCell>
              <TableCell>
                <ClientsPackageName packageId={client.current_package_id} />
              </TableCell>
              <TableCell>{client.remaining_servings}</TableCell>
              <TableCell>{formatDate(client.created_at)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(`/admin/clients/${client.client_id}`)}
                  title="צפייה בפרופיל"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ClientsTable;
