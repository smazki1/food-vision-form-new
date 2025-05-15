
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lead, LeadStatus, LeadSource } from "@/types/lead";

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setLeads(data as Lead[]);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      setError(err.message || "Failed to fetch leads");
      toast.error("Could not load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  const addLead = async (newLead: Omit<Lead, "id" | "created_at" | "last_updated_at">) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("leads")
        .insert(newLead)
        .select("*")
        .single();

      if (error) throw error;
      
      setLeads(prev => [data as Lead, ...prev]);
      toast.success("ליד חדש נוצר בהצלחה");
      return data as Lead;
    } catch (err: any) {
      console.error("Error adding lead:", err);
      toast.error(err.message || "Failed to create lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async (id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at">>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      
      setLeads(prev => prev.map(lead => lead.id === id ? (data as Lead) : lead));
      toast.success("הליד עודכן בהצלחה");
      return data as Lead;
    } catch (err: any) {
      console.error("Error updating lead:", err);
      toast.error(err.message || "Failed to update lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setLeads(prev => prev.filter(lead => lead.id !== id));
      toast.success("הליד נמחק בהצלחה");
    } catch (err: any) {
      console.error("Error deleting lead:", err);
      toast.error(err.message || "Failed to delete lead");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    return updateLead(id, { lead_status: status });
  };

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    fetchLeads,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus
  };
};
