import React, { useState } from "react";
import { Lead, LeadStatusEnum, LEAD_STATUS_DISPLAY } from "@/types/lead";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/utils/formatters";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "./StatusBadge";
import { ReminderCell } from "./ReminderCell";
import { DeleteLeadDialog } from "./DeleteLeadDialog";
import { LeadsTableLoadingState } from "./LeadsTableLoadingState";
import { LeadsEmptyState } from "./LeadsEmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  error: Error | null;
  onSort: (field: keyof Lead | 'actions' | 'select') => void;
  currentSort: { field: keyof Lead | 'actions' | 'select'; direction: 'asc' | 'desc' } | null;
  selectedLeads: Set<string>;
  onSelectLead: (leadId: string) => void;
  onSelectAllLeads: (selectAll: boolean) => void;
  onViewLead: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
}

const LEAD_STATUS_COLORS: Record<LeadStatusEnum, string> = {
  [LeadStatusEnum.NEW]: '#3B82F6',
  [LeadStatusEnum.INITIAL_CONTACT_MADE]: '#8B5CF6',
  [LeadStatusEnum.IN_TREATMENT]: '#F59E0B',
  [LeadStatusEnum.INTERESTED]: '#10B981',
  [LeadStatusEnum.NOT_INTERESTED]: '#EF4444',
  [LeadStatusEnum.CONVERTED_TO_CLIENT]: '#059669',
  [LeadStatusEnum.ARCHIVED]: '#D1D5DB',
};

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  error,
  onSort,
  currentSort,
  selectedLeads,
  onSelectLead,
  onSelectAllLeads,
  onViewLead,
  onEditLead,
  onDeleteLead
}) => {
  const renderSortableHeader = (field: keyof Lead | 'actions' | 'select', displayName: string) => {
    if (field === 'actions' || field === 'select') {
      return displayName;
    }
    const isSorted = currentSort?.field === field;
    return (
      <Button variant="ghost" onClick={() => onSort(field)}>
        {displayName}
        {isSorted ? (currentSort?.direction === 'asc' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />) : <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />}
      </Button>
    );
  };

  if (isLoading) {
    return <div className="text-center py-10">טוען לידים...</div>;
  }

  if (error) {
    return <div className="text-center py-10 text-red-500">שגיאה בטעינת לידים: {error.message}</div>;
  }

  if (leads.length === 0) {
    return <LeadsEmptyState />;
  }
  
  const allSelected = leads.length > 0 && selectedLeads.size === leads.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAllLeads(Boolean(checked))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>{renderSortableHeader("restaurant_name", "שם מסעדה")}</TableHead>
            <TableHead>{renderSortableHeader("contact_name", "איש קשר")}</TableHead>
            <TableHead>{renderSortableHeader("phone", "טלפון")}</TableHead>
            <TableHead>{renderSortableHeader("lead_status", "סטטוס")}</TableHead>
            <TableHead>{renderSortableHeader("updated_at", "תאריך עדכון")}</TableHead>            
            <TableHead>{renderSortableHeader("next_follow_up_date", "תזכורת")}</TableHead>
            <TableHead>{renderSortableHeader("total_ai_costs", "עלויות AI")}</TableHead>
            <TableHead>{renderSortableHeader("roi", "ROI")}</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.lead_id}>
              <TableCell>
                <Checkbox
                  checked={selectedLeads.has(lead.lead_id)}
                  onCheckedChange={() => onSelectLead(lead.lead_id)}
                  aria-label="Select row"
                />
              </TableCell>
              <TableCell className="font-medium hover:underline cursor-pointer" onClick={() => onViewLead(lead)}>
                {lead.restaurant_name}
              </TableCell>
              <TableCell>{lead.contact_name}</TableCell>
              <TableCell>{lead.phone}</TableCell>
              <TableCell>
                {lead.lead_status ? (
                  <Badge 
                    style={{ backgroundColor: LEAD_STATUS_COLORS[lead.lead_status] || 'grey' }} 
                    className="text-white rounded-none"
                  >
                    {LEAD_STATUS_DISPLAY[lead.lead_status] || lead.lead_status}
                  </Badge>
                ) : 'N/A'}
              </TableCell>
              <TableCell>{formatDate(lead.updated_at)}</TableCell>
              <TableCell>{formatDate(lead.next_follow_up_date)}</TableCell>
              <TableCell>{formatCurrency(lead.total_ai_costs)}</TableCell>
              <TableCell>{lead.roi ? `${lead.roi.toFixed(2)}%` : 'N/A'}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onEditLead(lead)} className="mr-2">
                  ערוך
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteLead(lead.lead_id)}>
                  מחק
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsTable;
