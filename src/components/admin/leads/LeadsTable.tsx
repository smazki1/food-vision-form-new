
import React, { useState } from "react";
import { Lead } from "@/types/lead";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { StatusBadge } from "./StatusBadge";
import { ReminderCell } from "./ReminderCell";
import { ActionsCell } from "./ActionsCell";
import { DeleteLeadDialog } from "./DeleteLeadDialog";
import { LeadsTableLoadingState } from "./LeadsTableLoadingState";
import { LeadsEmptyState } from "./LeadsEmptyState";

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy");
  };

  if (isLoading) {
    return <LeadsTableLoadingState />;
  }

  if (leads.length === 0) {
    return <LeadsEmptyState />;
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
                  <StatusBadge status={lead.lead_status} />
                </TableCell>
                <TableCell>{formatDate(lead.created_at)}</TableCell>
                <TableCell>{formatDate(lead.last_updated_at)}</TableCell>
                <TableCell>
                  <ReminderCell reminderDate={lead.reminder_at} />
                </TableCell>
                <TableCell>
                  <ActionsCell 
                    lead={lead} 
                    onEdit={onEdit} 
                    onDelete={handleDeleteClick}
                    onConvertToClient={onConvertToClient}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteLeadDialog 
        isOpen={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen} 
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default LeadsTable;
