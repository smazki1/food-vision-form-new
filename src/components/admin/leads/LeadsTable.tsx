
import React from "react";
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
import { Edit, MoreHorizontal, Trash2, UserPlus, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
  isLoading: boolean;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onEdit,
  onDelete,
  onConvertToClient,
  isLoading,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [leadToDelete, setLeadToDelete] = React.useState<string | null>(null);

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
        return "blue";
      case "פנייה ראשונית בוצעה":
        return "outline";
      case "מעוניין":
        return "green";
      case "לא מעוניין":
        return "destructive";
      case "נקבעה פגישה/שיחה":
        return "secondary";
      case "הדגמה בוצעה":
        return "blue";
      case "הצעת מחיר נשלחה":
        return "purple";
      case "ממתין לתשובה":
        return "warning";
      case "הפך ללקוח":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  const isReminderOverdue = (reminderDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminder = new Date(reminderDate);
    reminder.setHours(0, 0, 0, 0);
    
    return reminder < today;
  };

  const isReminderToday = (reminderDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reminder = new Date(reminderDate);
    reminder.setHours(0, 0, 0, 0);
    
    return reminder.getTime() === today.getTime();
  };

  const getReminderStyles = (reminderDate: string) => {
    if (isReminderOverdue(reminderDate)) {
      return "text-destructive font-bold";
    }
    if (isReminderToday(reminderDate)) {
      return "text-blue-600 font-bold";
    }
    return "";
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/30 rounded-md animate-pulse" />
        ))}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-center text-lg text-muted-foreground">
          לא נמצאו לידים
        </p>
        <p className="text-center text-muted-foreground">
          הוסף ליד חדש כדי להתחיל
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
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead>תאריך עדכון</TableHead>
              <TableHead>תזכורת</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.restaurant_name}</TableCell>
                <TableCell>{lead.contact_name}</TableCell>
                <TableCell>{lead.phone_number}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(lead.lead_status)}>
                    {lead.lead_status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(lead.created_at)}</TableCell>
                <TableCell>{formatDate(lead.last_updated_at)}</TableCell>
                <TableCell>
                  {lead.reminder_at ? (
                    <div className={`flex items-center gap-1 ${getReminderStyles(lead.reminder_at)}`}>
                      <Calendar className="h-4 w-4" />
                      {formatDate(lead.reminder_at)}
                    </div>
                  ) : (
                    "-"
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
                      {lead.lead_status !== "הפך ללקוח" && (
                        <DropdownMenuItem onClick={() => onConvertToClient(lead)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          המר ללקוח
                        </DropdownMenuItem>
                      )}
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
