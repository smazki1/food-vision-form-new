import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { CheckedState } from "@radix-ui/react-checkbox";
import { 
  Lead, 
  LeadStatusEnum,
  LEAD_STATUS_DISPLAY
} from '@/types/lead';
import { 
  Eye, 
  Edit, 
  Archive, 
  Trash2, 
  MessageSquare, 
  BarChart, 
  RotateCcw, 
  UserPlus
} from 'lucide-react';
import { 
  useArchiveLead, 
  useRestoreLead, 
  useDeleteLead, 
  useConvertLeadToClient 
} from '@/hooks/useEnhancedLeads';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { toast } from 'sonner';

// Status color mapping
const getStatusColor = (status: LeadStatusEnum): string => {
  const colors: Record<LeadStatusEnum, string> = {
    [LeadStatusEnum.NEW]: 'bg-blue-100 text-blue-800',
    [LeadStatusEnum.CONTACTED]: 'bg-orange-100 text-orange-800',
    [LeadStatusEnum.INTERESTED_SENT_PICS]: 'bg-green-100 text-green-800',
    [LeadStatusEnum.WAITING_REPLY]: 'bg-yellow-100 text-yellow-800',
    [LeadStatusEnum.MEETING_SCHEDULED]: 'bg-purple-100 text-purple-800',
    [LeadStatusEnum.DEMO_DONE]: 'bg-blue-200 text-blue-900',
    [LeadStatusEnum.QUOTE_SENT]: 'bg-pink-100 text-pink-800',
    [LeadStatusEnum.COLD_FOLLOW_UP]: 'bg-gray-100 text-gray-800',
    [LeadStatusEnum.NOT_INTERESTED]: 'bg-red-100 text-red-800',
    [LeadStatusEnum.CONVERTED_TO_CLIENT]: 'bg-green-200 text-green-900',
    [LeadStatusEnum.ARCHIVED]: 'bg-gray-100 text-gray-700',
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

interface EnhancedLeadsTableProps {
  leads: Lead[];
  onLeadSelect: (leadId: string) => void;
  selectedLeadId: string | null;
  isArchiveView: boolean;
}

export const EnhancedLeadsTable: React.FC<EnhancedLeadsTableProps> = ({
  leads,
  onLeadSelect,
  selectedLeadId,
  isArchiveView,
}) => {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  
  const archiveLead = useArchiveLead();
  const restoreLead = useRestoreLead();
  const deleteLead = useDeleteLead();
  const convertToClient = useConvertLeadToClient();
  
  // Handle archive action
  const handleArchive = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    archiveLead.mutate(leadId);
  };
  
  // Handle restore action
  const handleRestore = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    restoreLead.mutate(leadId);
  };
  
  // Handle delete action
  const handleDelete = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הליד לצמיתות? פעולה זו אינה ניתנת לביטול.')) {
      deleteLead.mutate(leadId);
    }
  };
  
  // Handle convert to client action
  const handleConvertToClient = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    if (window.confirm('האם להמיר ליד זה ללקוח?')) {
      convertToClient.mutate(leadId);
    }
  };
  
  // Handle checkbox selection
  const handleSelectLead = (checked: CheckedState, leadId: string) => {
    setSelectedLeads(prev => {
      if (checked === true) {
        return [...prev, leadId];
      } else {
        return prev.filter(id => id !== leadId);
      }
    });
  };
  
  // Handle select all
  const handleSelectAll = (checked: CheckedState) => {
    if (checked === true) {
      setSelectedLeads(leads.map(lead => lead.lead_id));
    } else {
      setSelectedLeads([]);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={leads.length > 0 && selectedLeads.length === leads.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="בחר את כל הלידים"
                />
              </TableHead>
              <TableHead>שם מסעדה</TableHead>
              <TableHead>איש קשר</TableHead>
              <TableHead>טלפון</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead className="text-right">עלויות AI</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                  לא נמצאו לידים
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow 
                  key={lead.lead_id}
                  className={`cursor-pointer ${selectedLeadId === lead.lead_id ? 'bg-muted/50' : ''}`}
                  onClick={() => onLeadSelect(lead.lead_id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedLeads.includes(lead.lead_id)}
                      onCheckedChange={(checked) => handleSelectLead(checked, lead.lead_id)}
                      aria-label={`בחר ליד ${lead.restaurant_name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{lead.restaurant_name}</TableCell>
                  <TableCell>{lead.contact_name}</TableCell>
                  <TableCell>{lead.phone}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status as LeadStatusEnum)}`}>
                      {LEAD_STATUS_DISPLAY[lead.status as LeadStatusEnum]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(lead.total_ai_costs)}
                  </TableCell>
                  <TableCell className="text-right">
                    {lead.roi !== null && lead.roi !== undefined
                      ? formatPercentage(lead.roi)
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-1 space-x-reverse">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeadSelect(lead.lead_id);
                        }}
                        title="צפייה בפרטים"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeadSelect(lead.lead_id);
                        }}
                        title="הוסף הערה"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLeadSelect(lead.lead_id);
                        }}
                        title="עדכון עלויות AI"
                      >
                        <BarChart className="h-4 w-4" />
                      </Button>
                      
                      {isArchiveView ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleRestore(e, lead.lead_id)}
                            title="שחזור מארכיון"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleDelete(e, lead.lead_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            title="מחיקה לצמיתות"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          {lead.status !== LeadStatusEnum.CONVERTED_TO_CLIENT && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => handleConvertToClient(e, lead.lead_id)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-100"
                              title="המרה ללקוח"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => handleArchive(e, lead.lead_id)}
                            title="העבר לארכיון"
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}; 