
import React, { useState, useMemo, useCallback } from "react";
import { 
  useEnhancedLeads, 
  useCreateLead, 
  useUpdateLead, 
  useDeleteLead 
} from "@/hooks/useEnhancedLeads";
import { Lead, LeadStatusEnum, LeadSourceEnum } from "@/types/lead";
import { EnhancedLeadsFilter } from "@/types/filters";
import { toast } from "sonner";

// Import our components
import { LeadsHeader } from "@/components/admin/leads/LeadsHeader";
import { LeadSearchBar } from "@/components/admin/leads/filters/LeadSearchBar";
import { LeadsFilterPopover } from "@/components/admin/leads/filters/LeadsFilterPopover";
import { ActiveFiltersBadges } from "@/components/admin/leads/filters/ActiveFiltersBadges";
import { LeadsContent } from "@/components/admin/leads/LeadsContent";
import { LeadFormSheet } from "@/components/admin/leads/LeadFormSheet";
import { LeadDetailsSheet } from "@/components/admin/leads/LeadDetailsSheet";

const LeadsManagement: React.FC = () => {
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<LeadStatusEnum | "all">("all");
  const [leadSource, setLeadSource] = useState<LeadSourceEnum | "all">("all");
  const [dateFilter, setDateFilter] = useState<"today" | "this-week" | "this-month" | "all">("all");
  const [onlyReminders, setOnlyReminders] = useState(false);
  const [remindersToday, setRemindersToday] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<keyof Lead | 'actions' | 'select'>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Lead form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLeadForForm, setCurrentLeadForForm] = useState<Lead | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  
  // Lead details state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLeadForDetails, setSelectedLeadForDetails] = useState<Lead | null>(null);

  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  // Create the filters object for useEnhancedLeads
  const filters = useMemo((): EnhancedLeadsFilter => ({
    searchTerm,
    status: status === "all" ? undefined : status,
    leadSource: leadSource === "all" ? undefined : leadSource,
    dateFilter: dateFilter === "all" ? undefined : dateFilter,
    onlyReminders,
    remindersToday,
    sortBy: sortBy as string,
    sortDirection,
    excludeArchived: true,
  }), [searchTerm, status, leadSource, dateFilter, onlyReminders, remindersToday, sortBy, sortDirection]);

  // Get leads with filters and sorting using the new hook
  const { data: leadsData, isLoading: loading, error } = useEnhancedLeads(filters);
  const leads = leadsData?.data || [];

  // Mutations from the new hook
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const deleteLeadMutation = useDeleteLead();
  
  const handleCreateLead = () => {
    setCurrentLeadForForm(undefined);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsDetailsOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsDetailsOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLeadMutation.mutateAsync(id);
      if (selectedLeadForDetails && selectedLeadForDetails.lead_id === id) {
        setIsDetailsOpen(false);
        setSelectedLeadForDetails(null);
      }
      setSelectedLeads(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      console.error("Error deleting lead from LeadsManagementPage:", err);
    }
  };

  const handleConvertToClient = (lead: Lead) => {
    setSelectedLeadForDetails(lead);
    setIsDetailsOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentLeadForForm(undefined);
  };

  const handleFormSubmit = async (formData: Partial<Omit<Lead, 'lead_id' | 'created_at' | 'updated_at' | 'total_ai_costs' | 'roi' | 'revenue_from_lead_usd'>>) => {
    try {
      setFormLoading(true);
      if (currentLeadForForm && currentLeadForForm.lead_id) {
        await updateLeadMutation.mutateAsync({ 
          leadId: currentLeadForForm.lead_id, 
          updates: formData 
        });
      } else {
        await createLeadMutation.mutateAsync(formData);
      }
      setIsFormOpen(false);
      setCurrentLeadForForm(undefined);
    } catch (err) {
      console.error("Form submission error in LeadsManagement:", err);
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleUpdateLeadDetails = async (id: string, updates: Partial<Lead>) => {
    try {
      await updateLeadMutation.mutateAsync({ 
        leadId: id, 
        updates: updates 
      });
      if (selectedLeadForDetails && selectedLeadForDetails.lead_id === id) {
        setSelectedLeadForDetails(prev => prev ? {...prev, ...updates} : null);
      }
    } catch (err) {
      console.error("Error updating lead from LeadsManagement:", err);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatus("all");
    setLeadSource("all");
    setDateFilter("all");
    setOnlyReminders(false);
    setRemindersToday(false);
    setSelectedLeads(new Set());
  };

  const handleSort = useCallback((field: keyof Lead | 'actions' | 'select') => {
    if (sortBy === field) {
      setSortDirection(prevDirection => prevDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  }, [sortBy]);

  const handleSelectLead = useCallback((leadId: string) => {
    setSelectedLeads(prevSelectedLeads => {
      const newSelectedLeads = new Set(prevSelectedLeads);
      if (newSelectedLeads.has(leadId)) {
        newSelectedLeads.delete(leadId);
      } else {
        newSelectedLeads.add(leadId);
      }
      return newSelectedLeads;
    });
  }, []);

  const handleSelectAllLeads = useCallback((selectAll: boolean) => {
    if (selectAll) {
      setSelectedLeads(new Set(leads.map(lead => lead.lead_id)));
    } else {
      setSelectedLeads(new Set());
    }
  }, [leads]);

  // Count active filters
  const activeFiltersCount = [
    status !== "all", 
    leadSource !== "all", 
    dateFilter !== "all", 
    onlyReminders, 
    remindersToday
  ].filter(Boolean).length;
  
  const currentSortForTable = useMemo(() => ({
    field: sortBy,
    direction: sortDirection
  }), [sortBy, sortDirection]);

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <LeadsHeader onCreateLead={handleCreateLead} />
        <div className="flex flex-col md:flex-row gap-3">
          <LeadSearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <LeadsFilterPopover
            open={filtersVisible}
            onOpenChange={setFiltersVisible}
            activeFiltersCount={activeFiltersCount}
            leadStatus={status}
            leadSource={leadSource}
            dateFilter={dateFilter}
            onlyReminders={onlyReminders}
            remindersToday={remindersToday}
            onLeadStatusChange={setStatus}
            onLeadSourceChange={setLeadSource}
            onDateFilterChange={setDateFilter}
            onOnlyRemindersChange={setOnlyReminders}
            onRemindersTodayChange={setRemindersToday}
            onClearAllFilters={clearAllFilters}
          />
        </div>
        <ActiveFiltersBadges 
          leadStatus={status}
          leadSource={leadSource}
          dateFilter={dateFilter}
          onlyReminders={onlyReminders}
          remindersToday={remindersToday}
          onClearLeadStatus={() => setStatus("all")}
          onClearLeadSource={() => setLeadSource("all")}
          onClearDateFilter={() => setDateFilter("all")}
          onClearOnlyReminders={() => setOnlyReminders(false)}
          onClearRemindersToday={() => setRemindersToday(false)}
          onClearAll={clearAllFilters}
        />
        <LeadsContent
          leads={leads || []}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
          activeFiltersCount={activeFiltersCount}
          currentSort={currentSortForTable}
          onSort={handleSort}
          onEditLead={handleEditLead}
          onDeleteLead={handleDeleteLead}
          onViewLead={handleViewLead}
          onConvertToClient={handleConvertToClient}
          selectedLeads={selectedLeads}
          onSelectLead={handleSelectLead}
          onSelectAllLeads={handleSelectAllLeads}
        />
        <LeadFormSheet
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          lead={currentLeadForForm}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
          isLoading={formLoading}
        />
        {selectedLeadForDetails && (
          <LeadDetailsSheet
            isOpen={isDetailsOpen}
            onClose={() => {
              setIsDetailsOpen(false);
              setSelectedLeadForDetails(null);
            }}
            lead={selectedLeadForDetails}
            onSave={(leadData) => handleUpdateLeadDetails(selectedLeadForDetails.lead_id, leadData)}
          />
        )}
      </div>
    </div>
  );
};

export default LeadsManagement;
