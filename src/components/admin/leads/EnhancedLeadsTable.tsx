import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MoreHorizontal, 
  Archive, 
  Trash2, 
  Edit, 
  Eye, 
  Bell, 
  User, 
  RefreshCw,
  Calendar,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Lead, 
  LeadStatusEnum, 
  LEAD_STATUS_DISPLAY,
  calculateTotalAICosts
} from '@/types/lead';
import { 
  useArchiveLead, 
  useRestoreLead, 
  useDeleteLead,
  useUpdateLead,
  useDirectConvertLeadToClient
} from '@/hooks/useEnhancedLeads';
import { FollowUpScheduler } from './FollowUpScheduler';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const statusColorMap: Record<LeadStatusEnum, string> = {
  [LeadStatusEnum.NEW]: 'bg-blue-100 text-blue-800',
  [LeadStatusEnum.INITIAL_CONTACT_MADE]: 'bg-purple-100 text-purple-800',
  [LeadStatusEnum.IN_TREATMENT]: 'bg-yellow-100 text-yellow-800',
  [LeadStatusEnum.INTERESTED]: 'bg-green-100 text-green-800',
  [LeadStatusEnum.NOT_INTERESTED]: 'bg-red-100 text-red-800',
  [LeadStatusEnum.CONVERTED_TO_CLIENT]: 'bg-purple-100 text-purple-800',
  [LeadStatusEnum.ARCHIVED]: 'bg-gray-100 text-gray-800',
};

// Helper function to get status badge color for free text statuses
const getStatusBadgeColor = (status: string): string => {
  // Check if it's a known enum status
  const enumStatus = Object.values(LeadStatusEnum).find(enumVal => enumVal === status) as LeadStatusEnum;
  
  if (enumStatus && statusColorMap[enumStatus]) {
    return statusColorMap[enumStatus];
  }
  
  // Default color for custom statuses
  return 'bg-blue-100 text-blue-800';
};

// Helper function to get status display text
const getStatusDisplayText = (status: string): string => {
  // Check if it's a known enum status
  const enumStatus = Object.values(LeadStatusEnum).find(enumVal => enumVal === status) as LeadStatusEnum;
  
  if (enumStatus && LEAD_STATUS_DISPLAY[enumStatus]) {
    return LEAD_STATUS_DISPLAY[enumStatus];
  }
  
  // Return the status as is for custom statuses
  return status;
};

interface EnhancedLeadsTableProps {
  leads: Lead[];
  onLeadSelect: (leadId: string) => void;
  selectedLeadId: string | null;
  isArchiveView?: boolean;
  selectedLeads?: Set<string>;
  onSelectLead?: (leadId: string) => void;
  onSelectAllLeads?: (selectAll: boolean) => void;
}

export const EnhancedLeadsTable: React.FC<EnhancedLeadsTableProps> = ({
  leads,
  onLeadSelect,
  selectedLeadId,
  isArchiveView = false,
  selectedLeads = new Set(),
  onSelectLead,
  onSelectAllLeads
}) => {
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  
  const archiveLeadMutation = useArchiveLead();
  const restoreLeadMutation = useRestoreLead();
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();
  const convertLeadMutation = useDirectConvertLeadToClient();

  const handleStatusChange = async (leadId: string, newStatus: LeadStatusEnum) => {
    try {
      await updateLeadMutation.mutateAsync({
        leadId,
        updates: { lead_status: newStatus }
      });
      toast.success('סטטוס הליד עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון סטטוס הליד');
    }
  };

  const handleArchiveLead = async (leadId: string) => {
    try {
      await archiveLeadMutation.mutateAsync(leadId);
      toast.success('הליד הועבר לארכיון בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהעברת הליד לארכיון');
    }
  };

  const handleRestoreLead = async (leadId: string) => {
    try {
      await restoreLeadMutation.mutateAsync(leadId);
      toast.success('הליד שוחזר בהצלחה');
    } catch (error) {
      toast.error('שגיאה בשחזור הליד');
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    
    try {
      await deleteLeadMutation.mutateAsync(leadToDelete);
      setDeleteConfirmOpen(false);
      setLeadToDelete(null);
      toast.success('הליד נמחק בהצלחה');
    } catch (error) {
      toast.error('שגיאה במחיקת הליד');
    }
  };

  const openFollowUpScheduler = (lead: Lead) => {
    setFollowUpLead(lead);
    setIsFollowUpOpen(true);
  };

  const closeFollowUpScheduler = () => {
    setFollowUpLead(null);
    setIsFollowUpOpen(false);
  };

  const confirmDelete = (leadId: string) => {
    setLeadToDelete(leadId);
    setDeleteConfirmOpen(true);
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">לא נמצאו לידים</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectAllLeads && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={leads.length > 0 && selectedLeads.size === leads.length}
                    onCheckedChange={(checked) => onSelectAllLeads(Boolean(checked))}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead className="w-[200px]">שם מסעדה</TableHead>
              <TableHead>איש קשר</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>מקור</TableHead>
              <TableHead>סוג עסק</TableHead>
              <TableHead>תאריך יצירה</TableHead>
              <TableHead>תזכורת</TableHead>
              <TableHead className="text-left">עלויות AI</TableHead>
              <TableHead className="text-right">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => {
              const isSelected = selectedLeadId === lead.lead_id;
              const hasReminder = !!lead.reminder_at;
              const reminderDate = hasReminder ? new Date(lead.reminder_at!) : null;
              const isReminderDue = reminderDate && reminderDate <= new Date();
              const totalAICosts = calculateTotalAICosts(lead);
              
              return (
                <TableRow 
                  key={lead.lead_id}
                  className={`${isSelected ? 'bg-muted/50' : ''} ${isReminderDue ? 'bg-yellow-50' : ''} hover:bg-gray-50 cursor-pointer`}
                  onClick={() => onLeadSelect(lead.lead_id)}
                >
                  {onSelectLead && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.lead_id)}
                        onCheckedChange={() => onSelectLead(lead.lead_id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <span className="hover:underline">
                        {lead.restaurant_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{lead.contact_name}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{lead.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadgeColor(lead.lead_status)} rounded-none`}>
                      {getStatusDisplayText(lead.lead_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lead.lead_source ? (
                      <span className="text-sm">{lead.lead_source}</span>
                    ) : (
                      <span className="text-sm text-gray-400">לא צוין</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.business_type ? (
                      <span className="text-sm">{lead.business_type}</span>
                    ) : (
                      <span className="text-sm text-gray-400">לא צוין</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-500" />
                      <span className="text-sm">
                        {format(new Date(lead.created_at), 'dd/MM/yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasReminder ? (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Bell className={`h-3 w-3 ${isReminderDue ? 'text-red-500' : 'text-amber-500'}`} />
                          <span className={`text-sm ${isReminderDue ? 'text-red-500 font-medium' : ''}`}>
                            {format(reminderDate!, 'dd/MM/yyyy')}
                          </span>
                        </div>
                        {lead.reminder_details && (
                          <span className="text-xs text-gray-500 truncate max-w-[150px]">
                            {lead.reminder_details}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">אין תזכורת</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-500" />
                      <span className="text-sm">
                        {totalAICosts.toFixed(2)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">פתח תפריט</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>פעולות</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onLeadSelect(lead.lead_id);
                        }}>
                          <Eye className="mr-2 h-4 w-4" />
                          צפה בפרטים
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          openFollowUpScheduler(lead);
                        }}>
                          <Bell className="mr-2 h-4 w-4" />
                          קבע תזכורת
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        
                        {!isArchiveView ? (
                          <>
                            <DropdownMenuLabel>שינוי סטטוס</DropdownMenuLabel>
                            {Object.values(LeadStatusEnum)
                              .filter(status => status !== LeadStatusEnum.ARCHIVED && status !== lead.lead_status)
                              .map(status => (
                                <DropdownMenuItem 
                                  key={status}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(lead.lead_id, status);
                                  }}
                                >
                                  <Badge className={`${statusColorMap[status]} mr-2`}>
                                    {LEAD_STATUS_DISPLAY[status]}
                                  </Badge>
                                </DropdownMenuItem>
                              ))
                            }
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                convertLeadMutation.mutate(lead.lead_id);
                              }}
                              disabled={lead.lead_status === LeadStatusEnum.CONVERTED_TO_CLIENT || convertLeadMutation.isPending}
                            >
                              <User className="mr-2 h-4 w-4" />
                              {convertLeadMutation.isPending ? 'המרה...' : 'המר ללקוח'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveLead(lead.lead_id);
                            }}>
                              <Archive className="mr-2 h-4 w-4" />
                              העבר לארכיון
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleRestoreLead(lead.lead_id);
                          }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            שחזר מארכיון
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(lead.lead_id);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          מחק
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Follow-up Scheduler Dialog */}
      {followUpLead && (
        <FollowUpScheduler 
          lead={followUpLead} 
          isOpen={isFollowUpOpen} 
          onClose={closeFollowUpScheduler} 
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם אתה בטוח שברצונך למחוק את הליד?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו היא בלתי הפיכה. הליד יימחק לצמיתות מהמערכת.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-red-600">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
