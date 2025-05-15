
import React, { useState } from "react";
import { Lead, LeadStatus } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit, MoreHorizontal, Trash2, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  isLoading: boolean;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setLeadToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (leadToDelete) {
      onDelete(leadToDelete);
    }
    setDeleteConfirmOpen(false);
    setLeadToDelete(null);
  };

  const getStatusBadgeVariant = (status: LeadStatus) => {
    switch (status) {
      case "ליד חדש":
        return "default";
      case "פנייה ראשונית בוצעה":
        return "outline";
      case "מעוניין":
        return "secondary";
      case "לא מעוניין":
        return "destructive";
      case "נקבעה פגישה/שיחה":
        return "blue";
      case "הדגמה בוצעה":
        return "green";
      case "הצעת מחיר נשלחה":
        return "purple";
      case "ממתין לתשובה":
        return "yellow";
      case "הפך ללקוח":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">טוען...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-center text-lg text-muted-foreground">
          לא נמצאו לידים
        </p>
        <p className="text-center text-muted-foreground">
          צור ליד חדש כדי להתחיל
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם מסעדה</TableHead>
              <TableHead>איש קשר</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>אימייל</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>מקור</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead>תזכורת</TableHead>
              <TableHead className="text-left">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.restaurant_name}</TableCell>
                <TableCell>{lead.contact_name}</TableCell>
                <TableCell>{lead.phone_number}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(lead.lead_status) as any}>
                    {lead.lead_status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.lead_source || "-"}</TableCell>
                <TableCell>{formatDate(lead.created_at)}</TableCell>
                <TableCell>
                  {lead.reminder_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(lead.reminder_at)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Edit className="mr-2 h-4 w-4" />
                        עריכה
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteClick(lead.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        מחיקה
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק לצמיתות את הליד ולא ניתן לשחזר אותו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>מחיקה</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LeadsTable;
