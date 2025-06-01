import React, { useState } from 'react';
import { EnhancedLeadsTable } from '@/components/admin/leads/EnhancedLeadsTable';
import { EnhancedLeadsFilters } from '@/components/admin/leads/EnhancedLeadsFilters';
import { LeadDetailPanel } from '@/components/admin/leads/LeadDetailPanel';
import { CreateLeadModal } from '@/components/admin/leads/CreateLeadModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useEnhancedLeads } from '@/hooks/useEnhancedLeads'; // Temporarily commented out
// import { useSimpleLeads } from '@/hooks/useSimpleLeads'; // Using simple hook for debugging
import { EnhancedLeadsFilter } from '@/types/filters';
import { Lead } from '@/types/lead'; // Import the Lead type
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
  const { data: leadsData, isLoading, error } = useEnhancedLeads(filters); // Temporarily commented out
  // const { data: simpleLeadsData, isLoading, error } = useSimpleLeads(); // Using simple hook
  
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
  const leads = leadsData?.data || []; // Temporarily commented out
  // const leads = (simpleLeadsData || []) as Lead[]; // Using data directly from simple hook, with type assertion for debugging
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול לידים</h1>
        
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>ליד חדש</span>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/admin/leads/costs-report">
              <BarChart2 className="h-4 w-4" />
              <span>דוח עלויות</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="flex items-center gap-2"
          >
            <Link to="/admin/leads/ai-pricing">
              <Settings className="h-4 w-4" />
              <span>הגדרות AI</span>
            </Link>
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