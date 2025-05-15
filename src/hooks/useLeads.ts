
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lead, LeadStatus } from "@/types/lead";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export const useLeads = () => {
  const queryClient = useQueryClient();
  
  // Fetch leads data
  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Lead[];
  }, []);
  
  const {
    data: leads = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ["leads"],
    queryFn: fetchLeads
  });

  const addLeadMutation = useMutation({
    mutationFn: async (newLead: Omit<Lead, "id" | "created_at" | "last_updated_at">) => {
      const { data, error } = await supabase
        .from("leads")
        .insert(newLead)
        .select("*")
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      console.error("Error adding lead:", err);
      toast.error(err.message || "Failed to create lead");
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at">> }) => {
      const { data, error } = await supabase
        .from("leads")
        .update(updates)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      console.error("Error updating lead:", err);
      toast.error(err.message || "Failed to update lead");
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (err: any) => {
      console.error("Error deleting lead:", err);
      toast.error(err.message || "Failed to delete lead");
    }
  });

  const addLead = async (newLead: Omit<Lead, "id" | "created_at" | "last_updated_at">) => {
    return addLeadMutation.mutateAsync(newLead);
  };

  const updateLead = async (id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at">>) => {
    return updateLeadMutation.mutateAsync({ id, updates });
  };

  const deleteLead = async (id: string) => {
    return deleteLeadMutation.mutateAsync(id);
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    return updateLead(id, { lead_status: status });
  };

  return {
    leads,
    loading,
    error: error as Error | null,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStatus
  };
};
