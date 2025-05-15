
import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStatus, LeadSource } from "@/types/lead";
import { LeadsFilter } from "@/types/filters";

export const fetchLeads = async (filters?: LeadsFilter) => {
  let query = supabase
    .from("leads")
    .select("*");
  
  // Apply filters if provided
  if (filters) {
    // Apply status filter
    if (filters.leadStatus && filters.leadStatus !== "all") {
      query = query.eq("lead_status", filters.leadStatus);
    }
    
    // Apply source filter
    if (filters.leadSource && filters.leadSource !== "all") {
      query = query.eq("lead_source", filters.leadSource);
    }
    
    // Apply date filter
    if (filters.dateFilter) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (filters.dateFilter === "today") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        query = query
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString());
      } else if (filters.dateFilter === "this-week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (Saturday)
        
        query = query
          .gte("created_at", startOfWeek.toISOString())
          .lt("created_at", endOfWeek.toISOString());
      } else if (filters.dateFilter === "this-month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        query = query
          .gte("created_at", startOfMonth.toISOString())
          .lte("created_at", endOfMonth.toISOString());
      }
    }
    
    // Apply reminders filter
    if (filters.onlyReminders) {
      query = query.not("reminder_at", "is", null);
    }
    
    // Apply reminders for today filter
    if (filters.remindersToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      query = query
        .gte("reminder_at", today.toISOString())
        .lt("reminder_at", tomorrow.toISOString());
    }
    
    // Apply sorting
    if (filters.sortBy) {
      query = query.order(filters.sortBy, { 
        ascending: filters.sortDirection === "asc"
      });
    } else {
      // Default sort by created_at descending
      query = query.order("created_at", { ascending: false });
    }
  } else {
    // Default sort by created_at descending if no filters provided
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) throw error;
  
  // Apply search term filter client-side (more flexible than DB query)
  let filteredData = data;
  if (filters?.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase();
    filteredData = data.filter((lead: Lead) => 
      lead.restaurant_name.toLowerCase().includes(searchTerm) ||
      lead.contact_name.toLowerCase().includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm) ||
      lead.phone_number.includes(searchTerm)
    );
  }
  
  return filteredData as Lead[];
};

export const addLead = async (newLead: Omit<Lead, "id" | "created_at" | "last_updated_at" | "lead_status" | "free_sample_package_active">) => {
  const leadToInsert = {
    ...newLead,
    lead_status: "ליד חדש" as LeadStatus,
    free_sample_package_active: false
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(leadToInsert)
    .select("*")
    .single();

  if (error) throw error;
  return data as Lead;
};

export const updateLead = async (id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at" | "free_sample_package_active">>) => {
  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as Lead;
};

export const deleteLead = async (id: string) => {
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return id;
};
