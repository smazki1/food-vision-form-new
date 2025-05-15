
import { useState } from "react";
import { toast } from "sonner";
import { Lead, LeadStatus } from "@/types/lead";
import { LeadsFilter } from "@/types/filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLeads, addLead as apiAddLead, updateLead as apiUpdateLead, deleteLead as apiDeleteLead } from "@/api/leadsApi";

export const useLeads = (filters?: LeadsFilter) => {
  const queryClient = useQueryClient();
  
  // Fetch leads data
  const {
    data: leads = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetchLeads(filters)
  });

  const addLeadMutation = useMutation({
    mutationFn: apiAddLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("הליד נוצר בהצלחה");
    },
    onError: (err: any) => {
      console.error("Error adding lead:", err);
      toast.error(err.message || "שגיאה ביצירת הליד");
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at" | "free_sample_package_active">> }) => 
      apiUpdateLead(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("הליד עודכן בהצלחה");
    },
    onError: (err: any) => {
      console.error("Error updating lead:", err);
      toast.error(err.message || "שגיאה בעדכון הליד");
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: apiDeleteLead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast.success("הליד נמחק בהצלחה");
    },
    onError: (err: any) => {
      console.error("Error deleting lead:", err);
      toast.error(err.message || "שגיאה במחיקת הליד");
    }
  });

  const addLead = async (newLead: Omit<Lead, "id" | "created_at" | "last_updated_at" | "lead_status" | "free_sample_package_active">) => {
    return addLeadMutation.mutateAsync(newLead);
  };

  const updateLead = async (id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at" | "free_sample_package_active">>) => {
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
