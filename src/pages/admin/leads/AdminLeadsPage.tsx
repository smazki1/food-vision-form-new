import React, { useState } from 'react';
import { EnhancedLeadsTable } from '@/components/admin/leads/EnhancedLeadsTable';
import { EnhancedLeadsFilters } from '@/components/admin/leads/EnhancedLeadsFilters';
import { LeadDetailPanel } from '@/components/admin/leads/LeadDetailPanel';
import { CreateLeadModal } from '@/components/admin/leads/CreateLeadModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useEnhancedLeads } from '@/hooks/useEnhancedLeads';
import { EnhancedLeadsFilter } from '@/types/filters';
import { Lead } from '@/types/lead';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  PlusCircle, 
  Archive, 
  BarChart2, 
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const AdminLeadsPage = () => {
  // State for filters
  const [filters, setFilters] = useState<EnhancedLeadsFilter>({
    searchTerm: '',
    status: 'all',
    leadSource: 'all',
    dateFilter: 'all',
    onlyReminders: false,
    remindersToday: false,
    sortBy: 'created_at',
    sortDirection: 'desc',
    excludeArchived: true,
    onlyArchived: false,
  });
  
  // State for active tab (leads or archive)
  const [activeTab, setActiveTab] = useState('leads');
  
  // State for selected lead
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  
  // State for create lead modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Update filters when changed
  const handleFilterChange = (newFilters: EnhancedLeadsFilter) => {
    setFilters(newFilters);
  };
  
  // Handle selecting a lead to view details
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };
  
  // Close the detail panel
  const handleCloseDetailPanel = () => {
    setSelectedLeadId(null);
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'leads') {
      setFilters(prev => ({
        ...prev,
        excludeArchived: true,
        onlyArchived: false,
      }));
    } else if (value === 'archive') {
      setFilters(prev => ({
        ...prev,
        excludeArchived: false,
        onlyArchived: true,
      }));
    }
  };
  
  // Fetch leads data
  const { data: leadsData, isLoading, error } = useEnhancedLeads(filters);
  
  // Handle error state
  if (error) {
    toast.error('Error loading leads: ' + (error as Error).message);
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl font-bold text-red-600">שגיאה בטעינת לידים</h2>
        <p className="mt-2">{(error as Error).message}</p>
      </div>
    );
  }
  
  // The leads to display based on the current tab
  const leads = leadsData?.data || [];
  
  return (
    <div className="container mx-auto py-6 px-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ניהול לידים</h1>
        <div className="flex gap-2">
          <Link to="/admin/leads/ai-pricing">
            <Button variant="outline" size="sm">
              <BarChart2 className="h-4 w-4 ml-1" />
              תמחור AI
            </Button>
          </Link>
          <Link to="/admin/leads/costs-report">
            <Button variant="outline" size="sm">
              <BarChart2 className="h-4 w-4 ml-1" />
              דוח עלויות
            </Button>
          </Link>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <PlusCircle className="h-4 w-4 ml-1" />
            ליד חדש
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="leads" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="leads">לידים פעילים</TabsTrigger>
          <TabsTrigger value="archive">ארכיון</TabsTrigger>
        </TabsList>
        
        <TabsContent value="leads">
          <EnhancedLeadsFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            isArchiveView={false}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <EnhancedLeadsTable 
              leads={leads}
              onLeadSelect={handleLeadSelect}
              selectedLeadId={selectedLeadId}
              isArchiveView={false}
            />
          )}
        </TabsContent>
        
        <TabsContent value="archive">
          <EnhancedLeadsFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            isArchiveView={true}
          />
          
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <EnhancedLeadsTable 
              leads={leads}
              onLeadSelect={handleLeadSelect}
              selectedLeadId={selectedLeadId}
              isArchiveView={true}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Lead detail panel */}
      {selectedLeadId && (
        <LeadDetailPanel
          leadId={selectedLeadId}
          onClose={handleCloseDetailPanel}
          isArchiveView={activeTab === 'archive'}
        />
      )}
      
      {/* Create lead modal */}
      <CreateLeadModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  );
};

export default AdminLeadsPage; 