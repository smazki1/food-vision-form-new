
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
import { ArrowUpAZ, ArrowDownAZ } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ReminderCell } from "./ReminderCell";
import { ActionsCell } from "./ActionsCell";
import { DeleteLeadDialog } from "./DeleteLeadDialog";
import { LeadsTableLoadingState } from "./LeadsTableLoadingState";
import { LeadsEmptyState } from "./LeadsEmptyState";
import { Button } from "@/components/ui/button";

interface LeadsTableProps {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
  isLoading: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort: (field: string) => void;
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onEdit,
  onDelete,
  onConvertToClient,
  isLoading,
  sortBy = "",
  sortDirection = "desc",
  onSort,
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

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortDirection === "asc" ? (
      <ArrowUpAZ className="w-4 h-4 mr-1" />
    ) : (
      <ArrowDownAZ className="w-4 h-4 mr-1" />
    );
  };

  const renderSortableHeader = (field: string, label: string) => (
    <Button 
      variant="ghost" 
      size="sm" 
      className="p-0 font-medium flex items-center hover:bg-transparent hover:text-primary" 
      onClick={() => onSort(field)}
    >
      {renderSortIcon(field)}
      {label}
    </Button>
  );

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
              <TableHead>{renderSortableHeader("restaurant_name", "שם מסעדה")}</TableHead>
              <TableHead>{renderSortableHeader("contact_name", "איש קשר")}</TableHead>
              <TableHead>{renderSortableHeader("phone_number", "טלפון")}</TableHead>
              <TableHead>{renderSortableHeader("lead_status", "סטטוס")}</TableHead>
              <TableHead>{renderSortableHeader("created_at", "תאריך יצירה")}</TableHead>
              <TableHead>{renderSortableHeader("last_updated_at", "תאריך עדכון")}</TableHead>
              <TableHead>{renderSortableHeader("reminder_at", "תזכורת")}</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onEdit(lead)}
              >
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
                <TableCell onClick={(e) => e.stopPropagation()}>
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
