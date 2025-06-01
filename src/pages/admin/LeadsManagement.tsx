import React, { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/models";
import { LeadStatus, LeadSource } from "@/types/models";
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
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "all">("all");
  const [leadSource, setLeadSource] = useState<LeadSource | "all">("all");
  const [dateFilter, setDateFilter] = useState<"today" | "this-week" | "this-month" | "all">("all");
  const [onlyReminders, setOnlyReminders] = useState(false);
  const [remindersToday, setRemindersToday] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Lead form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);
  
  // Lead details state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Get leads with filters and sorting
  const { leads = [], loading, addLead, updateLead, deleteLead } = useLeads({
    searchTerm,
    leadStatus,
    leadSource,
    dateFilter,
    onlyReminders,
    remindersToday,
    sortBy,
    sortDirection
  });
  
  const handleCreateLead = () => {
    setCurrentLead(undefined);
    setIsFormOpen(true);
  };

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleViewLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      if (deleteLead) {
        await deleteLead(id);
      }
      if (selectedLead && selectedLead.lead_id === id) {
        setIsDetailsOpen(false);
        setSelectedLead(null);
      }
    } catch (error) {
      console.error("Error deleting lead from LeadsManagementPage:", error);
      toast.error("שגיאה במחיקת הליד");
    }
  };

  const handleConvertToClient = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
    // The conversion functionality is handled in the details sheet
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentLead(undefined);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      if (currentLead && updateLead) {
        await updateLead({ leadId: currentLead.lead_id, updates: data });
      } else if (addLead) {
        await addLead(data);
      }
      
      setIsFormOpen(false);
      setCurrentLead(undefined);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("שגיאה בשמירת הליד");
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleUpdateLead = async (id: string, updates: Partial<Lead>) => {
    try {
      if (updateLead) {
        await updateLead({ leadId: id, updates });
      }
      if (selectedLead && selectedLead.lead_id === id) {
        setSelectedLead({
          ...selectedLead,
          ...updates,
          updated_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("שגיאה בעדכון הליד");
      throw error;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setLeadStatus("all");
    setLeadSource("all");
    setDateFilter("all");
    setOnlyReminders(false);
    setRemindersToday(false);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  // Count active filters with null safety
  const activeFiltersCount = [
    leadStatus !== "all", 
    leadSource !== "all", 
    dateFilter !== "all", 
    onlyReminders, 
    remindersToday
  ].filter(Boolean).length;

  // Safe leads array
  const safeLeads = Array.isArray(leads) ? leads : [];

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
            leadStatus={leadStatus}
            leadSource={leadSource}
            dateFilter={dateFilter}
            onlyReminders={onlyReminders}
            remindersToday={remindersToday}
            onLeadStatusChange={setLeadStatus}
            onLeadSourceChange={setLeadSource}
            onDateFilterChange={setDateFilter}
            onOnlyRemindersChange={setOnlyReminders}
            onRemindersTodayChange={setRemindersToday}
            onClearAllFilters={clearAllFilters}
          />
        </div>
        <ActiveFiltersBadges
          leadStatus={leadStatus}
          leadSource={leadSource}
          dateFilter={dateFilter}
          onlyReminders={onlyReminders}
          remindersToday={remindersToday}
          onClearLeadStatus={() => setLeadStatus("all")}
          onClearLeadSource={() => setLeadSource("all")}
          onClearDateFilter={() => setDateFilter("all")}
          onClearOnlyReminders={() => setOnlyReminders(false)}
          onClearRemindersToday={() => setRemindersToday(false)}
          onClearAll={clearAllFilters}
        />
        <LeadsContent
          leads={safeLeads}
          loading={loading}
          searchTerm={searchTerm}
          activeFiltersCount={activeFiltersCount}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={handleSort}
          onEdit={handleEditLead}
          onDelete={handleDeleteLead}
          onConvertToClient={handleConvertToClient}
        />
        <LeadFormSheet
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          lead={currentLead}
          onSubmit={handleFormSubmit}
          onCancel={handleCloseForm}
          isLoading={formLoading}
        />
        <LeadDetailsSheet
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          lead={selectedLead}
          onUpdate={handleUpdateLead}
          onDeleteLeadConfirm={handleDeleteLead}
        />
      </div>
    </div>
  );
};

export default LeadsManagement;
