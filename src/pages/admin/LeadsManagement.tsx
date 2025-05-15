
import React, { useState } from "react";
import { useLeads } from "@/hooks/useLeads";
import { Lead, LeadStatus, LeadSource } from "@/types/lead";
import { toast } from "sonner";

// Import our newly created components
import { LeadsHeader } from "@/components/admin/leads/LeadsHeader";
import { LeadSearchBar } from "@/components/admin/leads/filters/LeadSearchBar";
import { LeadsFilterPopover } from "@/components/admin/leads/filters/LeadsFilterPopover";
import { ActiveFiltersBadges } from "@/components/admin/leads/filters/ActiveFiltersBadges";
import { LeadsContent } from "@/components/admin/leads/LeadsContent";
import { LeadFormSheet } from "@/components/admin/leads/LeadFormSheet";

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

  // Get leads with filters and sorting
  const { leads, loading, addLead, updateLead, deleteLead } = useLeads({
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
    setCurrentLead(lead);
    setIsFormOpen(true);
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await deleteLead(id);
      // Toast is handled in the mutation
    } catch (error) {
      console.error("Error deleting lead:", error);
    }
  };

  const handleConvertToClient = (lead: Lead) => {
    // This is a placeholder for future implementation (Section 1.2.2)
    toast.info("המרת ליד ללקוח תיושם בהמשך");
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setCurrentLead(undefined);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      
      if (currentLead) {
        await updateLead(currentLead.id, data);
        // Toast is handled in the mutation
      } else {
        await addLead(data);
        // Toast is handled in the mutation
      }
      
      setIsFormOpen(false);
      setCurrentLead(undefined);
    } catch (error) {
      console.error("Form submission error:", error);
      // Toast is handled in the mutation
    } finally {
      setFormLoading(false);
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
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending order
      setSortBy(field);
      setSortDirection("desc");
    }
  };

  // Count active filters
  const activeFiltersCount = [
    leadStatus !== "all", 
    leadSource !== "all", 
    dateFilter !== "all", 
    onlyReminders, 
    remindersToday
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      <LeadsHeader onCreateLead={handleCreateLead} />

      {/* Search and Filter Controls */}
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

      {/* Active Filters Display */}
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

      {/* Leads Content (Table or Loading State) */}
      <LeadsContent
        leads={leads}
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

      {/* Lead Form Sheet */}
      <LeadFormSheet
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        lead={currentLead}
        onSubmit={handleFormSubmit}
        onCancel={handleCloseForm}
        isLoading={formLoading}
      />
    </div>
  );
};

export default LeadsManagement;
