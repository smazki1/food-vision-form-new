import React, { useState } from 'react';
import { useEnhancedLeads } from '@/hooks/useEnhancedLeads';
import { EnhancedLeadsFilter } from '@/types/filters';
import { LeadStatusEnum, Lead } from '@/types/lead';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedLeadsTable } from '@/components/admin/leads/EnhancedLeadsTable';
import { EnhancedLeadsFilters } from '@/components/admin/leads/EnhancedLeadsFilters';
import { Button } from '@/components/ui/button';
import { PlusCircle, Archive, BarChart2, Settings } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { CreateLeadModal } from '@/components/admin/leads/CreateLeadModal';
import { LeadDetailPanel } from '@/components/admin/leads/LeadDetailPanel';
import AdminLayout from '@/layouts/AdminLayout';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const EnhancedLeadsManagement: React.FC = () => {
  const [filters, setFilters] = useState<EnhancedLeadsFilter>({
    excludeArchived: true,
    sortBy: 'created_at',
    sortDirection: 'desc'
  });
  
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('active-leads');
  
  const { data: leadsData, isLoading, error } = useEnhancedLeads(filters);
  
  const handleFilterChange = (newFilters: EnhancedLeadsFilter) => {
    setFilters({ ...filters, ...newFilters });
  };
  
  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
  };
  
  const handleCloseDetailPanel = () => {
    setSelectedLeadId(null);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'active-leads') {
      setFilters({ ...filters, excludeArchived: true, onlyArchived: false });
    } else if (value === 'archived-leads') {
      setFilters({ ...filters, excludeArchived: false, onlyArchived: true });
    }
  };
  
  if (error) {
    toast.error('Error loading leads: ' + (error as Error).message);
    return (
      <AdminLayout>
        <div className="p-4 text-center">
          <h2 className="text-xl font-bold text-red-600">שגיאה בטעינת לידים</h2>
          <p className="mt-2">{(error as Error).message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            נסה שוב
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
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
    </AdminLayout>
  );
};

export default EnhancedLeadsManagement; 