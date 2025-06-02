import React, { useState, useEffect } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  UserPlus,
  Settings,
  GripVertical,
  AlertTriangle
} from 'lucide-react';
import { 
  useArchiveLead, 
  useRestoreLead, 
  useDeleteLead, 
  useConvertLeadToClient 
} from '@/hooks/useEnhancedLeads';
import { formatCurrency, formatPercentage } from '@/utils/formatters';
import { toast } from 'sonner';

// Column definitions
export interface ColumnConfig {
  id: string;
  key: string;
  label: string;
  visible: boolean;
  sortable?: boolean;
  width?: string;
  required?: boolean; // Some columns like actions should always be visible
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'select', key: 'select', label: 'בחירה', visible: true, width: '50px', required: true },
  { id: 'restaurant_name', key: 'restaurant_name', label: 'שם מסעדה', visible: true, sortable: true },
  { id: 'contact_name', key: 'contact_name', label: 'איש קשר', visible: true },
  { id: 'phone', key: 'phone', label: 'טלפון', visible: true },
  { id: 'email', key: 'email', label: 'אימייל', visible: false },
  { id: 'business_type', key: 'business_type', label: 'סוג עסק', visible: false },
  { id: 'status', key: 'lead_status', label: 'סטטוס', visible: true, sortable: true },
  { id: 'source', key: 'lead_source', label: 'מקור', visible: false },
  { id: 'ai_costs', key: 'total_ai_costs', label: 'עלויות AI', visible: true, sortable: true },
  { id: 'roi', key: 'roi', label: 'ROI', visible: true, sortable: true },
  { id: 'created_at', key: 'created_at', label: 'תאריך יצירה', visible: false },
  { id: 'next_follow_up', key: 'next_follow_up_date', label: 'תזכורת', visible: false },
  { id: 'actions', key: 'actions', label: 'פעולות', visible: true, width: '200px', required: true },
];

// Force reset function to clear localStorage issues
const forceResetColumns = () => {
  localStorage.removeItem('leads-table-columns');
  console.log('🔧 נוקה localStorage של עמודות הטבלה - ROI אמור להיות מוצג כעת');
  window.location.reload(); // Reload to apply changes
};

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

// Sortable column item for settings dropdown
const SortableColumnItem = ({
  column,
  onToggleVisibility
}: {
  column: ColumnConfig;
  onToggleVisibility: (columnId: string, visible: boolean) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded hover:bg-muted"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <Checkbox
        checked={column.visible}
        onCheckedChange={(checked) => onToggleVisibility(column.id, !!checked)}
        disabled={column.required}
      />
      <span className={`text-sm flex-1 ${column.required ? 'text-muted-foreground' : ''}`}>
        {column.label}
        {column.required && ' (חובה)'}
      </span>
    </div>
  );
};

// Column settings dropdown
const ColumnSettingsDropdown = ({ 
  columns, 
  onReorder, 
  onToggleVisibility 
}: {
  columns: ColumnConfig[];
  onReorder: (newOrder: ColumnConfig[]) => void;
  onToggleVisibility: (columnId: string, visible: boolean) => void;
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id);
      const newIndex = columns.findIndex(col => col.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(columns, oldIndex, newIndex));
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 ml-1" />
          הגדרות עמודות
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel>הגדרות תצוגת טבלה</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2">
          <p className="text-sm text-muted-foreground mb-2">גרור כדי לשנות סדר עמודות:</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={columns.map(col => col.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {columns.map(column => (
                  <SortableColumnItem
                    key={column.id}
                    column={column}
                    onToggleVisibility={onToggleVisibility}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onReorder(DEFAULT_COLUMNS)}>
          אפס להגדרות ברירת מחדל
        </DropdownMenuItem>
        <DropdownMenuItem onClick={forceResetColumns} className="text-orange-600 hover:text-orange-800">
          🔧 איפוס מלא (תיקון ROI)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  
  const archiveLead = useArchiveLead();
  const restoreLead = useRestoreLead();
  const deleteLead = useDeleteLead();
  const convertToClient = useConvertLeadToClient();

  // Load column config from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem('leads-table-columns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        setColumns(parsed);
      } catch (error) {
        console.error('Failed to parse saved columns:', error);
      }
    }
  }, []);

  // Save column config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('leads-table-columns', JSON.stringify(columns));
  }, [columns]);

  // Column management functions
  const handleColumnReorder = (newOrder: ColumnConfig[]) => {
    setColumns(newOrder);
  };
  
  const handleToggleColumnVisibility = (columnId: string, visible: boolean) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible } : col
    ));
  };

  // Get visible columns for rendering
  const visibleColumns = columns.filter(col => col.visible);
  
  // Debug ROI data
  const leadsWithROI = leads.filter(lead => lead.roi !== null && lead.roi !== undefined);
  const leadsWithRevenueAndCosts = leads.filter(lead => 
    (lead.revenue_from_lead_local && lead.revenue_from_lead_local > 0) || 
    (lead.total_ai_costs && lead.total_ai_costs > 0)
  );
  
  // Log debug info about ROI
  useEffect(() => {
    if (leads.length > 0) {
      console.log(`🔍 ROI Debug Info:
        - Total leads: ${leads.length}
        - Leads with ROI data: ${leadsWithROI.length}
        - Leads with revenue/costs: ${leadsWithRevenueAndCosts.length}
        - ROI column visible: ${visibleColumns.find(col => col.id === 'roi') ? 'YES' : 'NO'}
        - Sample lead with ROI:`, leadsWithROI[0] || 'None');
    }
  }, [leads, leadsWithROI.length, visibleColumns]);

  // Handle archive action
  const handleArchive = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    archiveLead.mutate(leadId);
  };
  
  // Handle restore action
  const handleRestore = (e: React.MouseEvent, leadId: string) => {
    e.stopPropagation(); // Prevent row click
    restoreLead.mutate({ leadId, newStatus: LeadStatusEnum.NEW });
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

  // Render cell based on column type
  const renderCell = (column: ColumnConfig, lead: Lead) => {
    switch (column.id) {
      case 'select':
        return (
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox 
              checked={selectedLeads.includes(lead.lead_id)}
              onCheckedChange={(checked) => handleSelectLead(checked, lead.lead_id)}
              aria-label={`בחר ליד ${lead.restaurant_name}`}
            />
          </TableCell>
        );
      case 'restaurant_name':
        return <TableCell className="font-medium">{lead.restaurant_name}</TableCell>;
      case 'contact_name':
        return <TableCell>{lead.contact_name}</TableCell>;
      case 'phone':
        return <TableCell>{lead.phone}</TableCell>;
      case 'email':
        return <TableCell>{lead.email}</TableCell>;
      case 'business_type':
        return <TableCell>{lead.business_type || '—'}</TableCell>;
      case 'status':
        return (
          <TableCell>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.lead_status as LeadStatusEnum)}`}>
              {LEAD_STATUS_DISPLAY[lead.lead_status as LeadStatusEnum]}
            </span>
          </TableCell>
        );
      case 'source':
        return <TableCell>{lead.lead_source || '—'}</TableCell>;
      case 'ai_costs':
        return (
          <TableCell className="text-right">
            {formatCurrency(lead.total_ai_costs || 0)}
          </TableCell>
        );
      case 'roi':
        return (
          <TableCell className="text-right">
            {lead.roi !== null && lead.roi !== undefined
              ? formatPercentage(lead.roi)
              : '—'}
          </TableCell>
        );
      case 'created_at':
        return (
          <TableCell>
            {lead.created_at ? new Date(lead.created_at).toLocaleDateString('he-IL') : '—'}
          </TableCell>
        );
      case 'next_follow_up':
        return (
          <TableCell>
            {lead.next_follow_up_date ? new Date(lead.next_follow_up_date).toLocaleDateString('he-IL') : '—'}
          </TableCell>
        );
      case 'actions':
        return (
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
                  {lead.lead_status !== LeadStatusEnum.CONVERTED_TO_CLIENT && (
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
        );
      default:
        return <TableCell>—</TableCell>;
    }
  };

  return (
    <div className="space-y-4">
      {/* ROI Column Warning */}
      {!visibleColumns.find(col => col.id === 'roi') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <span className="text-yellow-800 text-sm">
            <strong>שים לב:</strong> עמודת ה-ROI לא מוצגת כרגע. 
            לחץ על "הגדרות עמודות" ובחר "🔧 איפוס מלא (תיקון ROI)" לתיקון הבעיה.
          </span>
        </div>
      )}

      {/* Column Settings */}
      <div className="flex justify-end">
        <ColumnSettingsDropdown
          columns={columns}
          onReorder={handleColumnReorder}
          onToggleVisibility={handleToggleColumnVisibility}
        />
      </div>

      {/* Table */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.id} 
                    className={column.width ? `w-[${column.width}]` : ''}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center h-32 text-muted-foreground">
                    לא נמצאו לידים
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow 
                    key={lead.lead_id}
                    className={`cursor-pointer hover:bg-muted/30 transition-colors ${selectedLeadId === lead.lead_id ? 'bg-muted/50' : ''}`}
                    onClick={() => onLeadSelect(lead.lead_id)}
                  >
                    {visibleColumns.map(column => renderCell(column, lead))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Selected leads summary */}
        {selectedLeads.length > 0 && (
          <div className="border-t bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                נבחרו {selectedLeads.length} לידים
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    if (window.confirm(`האם להעביר ${selectedLeads.length} לידים לארכיון?`)) {
                      selectedLeads.forEach(leadId => archiveLead.mutate(leadId));
                      setSelectedLeads([]);
                    }
                  }}
                  disabled={isArchiveView}
                >
                  <Archive className="h-4 w-4 ml-1" />
                  העבר לארכיון
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLeads([])}
                >
                  בטל בחירה
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 