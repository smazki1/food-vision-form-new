import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Trash2, X, PlusCircle, BarChart2, Settings } from 'lucide-react';
import { 
  useEnhancedLeads,
  useBulkDeleteLeads,
  useBulkArchiveLeads 
} from '@/hooks/useEnhancedLeads';
import { EnhancedLeadsFilter } from '@/types/filters';
import { EnhancedLeadsTable } from '@/components/admin/leads/EnhancedLeadsTable';
import { LeadDetailPanel } from '@/components/admin/leads/LeadDetailPanel';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { CreateLeadModal } from '@/components/admin/leads/CreateLeadModal';
import { EnhancedLeadsFilters } from '@/components/admin/leads/EnhancedLeadsFilters';
import { Badge } from '@/components/admin/leads/Badge';
import { LeadsFilters } from '@/components/admin/leads/filters/LeadsFilters';
import { CreateLeadDialog } from '@/components/admin/leads/CreateLeadDialog';

const EnhancedLeadsManagement: React.FC = () => {
  const [filters, setFilters] = useState<EnhancedLeadsFilter>({
    excludeArchived: true,
    sortBy: 'created_at',
    sortDirection: 'desc'
  });
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active-leads');
  
  // State for bulk selection
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  
  const { data: leadsData, isLoading, error } = useEnhancedLeads(filters);
  
  // Bulk operations hooks
  const bulkDeleteMutation = useBulkDeleteLeads();
  const bulkArchiveMutation = useBulkArchiveLeads();
  
  const handleFilterChange = (newFilters: EnhancedLeadsFilter) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };
  
  const handleCloseDetailPanel = () => {
    setSelectedLeadId(null);
  };
  
  // Handle bulk selection
  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(leadId)) {
        newSelected.delete(leadId);
      } else {
        newSelected.add(leadId);
      }
      return newSelected;
    });
  };
  
  const handleSelectAllLeads = (selectAll: boolean) => {
    const leads = leadsData?.data || [];
    if (selectAll) {
      setSelectedLeads(new Set(leads.map(lead => lead.lead_id)));
    } else {
      setSelectedLeads(new Set());
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'active-leads') {
      setFilters({ ...filters, excludeArchived: true, onlyArchived: false });
    } else if (value === 'archived-leads') {
      setFilters({ ...filters, excludeArchived: false, onlyArchived: true });
    }
  };
  
  // Bulk actions handlers
  const handleBulkDelete = async () => {
    if (selectedLeads.size === 0) return;
    
    if (window.confirm(`האם אתה בטוח שברצונך למחוק ${selectedLeads.size} לידים?`)) {
      try {
        await bulkDeleteMutation.mutateAsync(Array.from(selectedLeads));
        toast.success(`${selectedLeads.size} לידים נמחקו בהצלחה`);
        setSelectedLeads(new Set());
      } catch (error) {
        console.error('Error deleting leads:', error);
        toast.error('שגיאה במחיקת לידים');
      }
    }
  };
  
  const handleBulkArchive = async () => {
    if (selectedLeads.size === 0) return;
    
    try {
      await bulkArchiveMutation.mutateAsync(Array.from(selectedLeads));
      toast.success(`${selectedLeads.size} לידים הועברו לארכיון`);
      setSelectedLeads(new Set());
    } catch (error) {
      console.error('Error archiving leads:', error);
      toast.error('שגיאה בהעברת לידים לארכיון');
    }
  };
  
  const clearSelection = () => {
    setSelectedLeads(new Set());
  };
  
  if (error) {
    toast.error('Error loading leads: ' + (error as Error).message);
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">שגיאה בטעינת לידים</h2>
        <p className="mt-2">{(error as Error).message}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>
          נסה שוב
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול לידים</h1>
        
        <div className="flex space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle size={16} />
            ליד חדש
          </Button>
          
          <Link to="/admin/leads/costs-report">
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart2 size={16} />
              דוח עלויות
            </Button>
          </Link>
          
          <Link to="/admin/leads/ai-pricing">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings size={16} />
              הגדרות מחירי AI
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Bulk Actions Bar */}
      {selectedLeads.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedLeads.size} לידים נבחרו
            </span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkArchive}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Archive className="h-4 w-4 ml-1" />
                העבר לארכיון
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleBulkDelete}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 ml-1" />
                מחק
              </Button>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={clearSelection}
            className="text-blue-700 hover:bg-blue-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active-leads">לידים פעילים</TabsTrigger>
          <TabsTrigger value="archived-leads">
            <Archive size={16} className="mr-1" />
            ארכיון
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active-leads" className="space-y-4">
          <EnhancedLeadsFilters filters={filters} onFilterChange={handleFilterChange} />
          
          {isLoading ? (
            <div className="w-full flex justify-center p-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <EnhancedLeadsTable
              leads={leadsData?.data || []}
              onLeadSelect={handleLeadSelect}
              selectedLeadId={selectedLeadId}
              isArchiveView={false}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
              onSelectAllLeads={handleSelectAllLeads}
            />
          )}
        </TabsContent>
        
        <TabsContent value="archived-leads" className="space-y-4">
          <EnhancedLeadsFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            isArchiveView
          />
          
          {isLoading ? (
            <div className="w-full flex justify-center p-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <EnhancedLeadsTable
              leads={leadsData?.data || []}
              onLeadSelect={handleLeadSelect}
              selectedLeadId={selectedLeadId}
              isArchiveView={true}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
              onSelectAllLeads={handleSelectAllLeads}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Lead Detail Side Panel */}
      {selectedLeadId && (
        <LeadDetailPanel 
          leadId={selectedLeadId}
          onClose={handleCloseDetailPanel} 
          isArchiveView={activeTab === 'archived-leads'}
        />
      )}
      
      {/* Create Lead Modal */}
      <CreateLeadModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default EnhancedLeadsManagement; 