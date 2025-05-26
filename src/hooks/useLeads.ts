
import { useState } from "react";
import { toast } from "sonner";
import { Lead, LeadStatus } from "@/types/lead";
import { LeadsFilter } from "@/types/filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchLeads, addLead as apiAddLead, updateLead as apiUpdateLead, deleteLead as apiDeleteLead } from "@/api/leadsApi";
import { useOptimisticUpdates } from "./useOptimisticUpdates";
import { useCachedQuery } from "./useCachedQuery";
import { cacheService } from "@/services/cacheService";
import { generateId } from "@/utils/generateId";

export const useLeads = (filters?: LeadsFilter) => {
  const queryClient = useQueryClient();
  const { applyOptimisticUpdate, confirmUpdate, revertUpdate } = useOptimisticUpdates<Lead>();
  
  // Create a serialized cache key from filters
  const filtersCacheKey = filters ? JSON.stringify(filters) : 'no-filters';
  
  // Use cached query for leads data
  const {
    data: leads = [],
    isLoading: loading,
    error,
    invalidateCache
  } = useCachedQuery({
    queryKey: ["leads", filters],
    queryFn: () => fetchLeads(filters),
    cacheKey: `leads_${filtersCacheKey}`,
    cacheTTL: 3 * 60 * 1000, // 3 minutes for leads (they change frequently)
    backgroundRefresh: true,
    onCacheHit: (data) => console.log(`[CACHE] Leads cache hit: ${data.length} leads`),
    onCacheMiss: () => console.log(`[CACHE] Leads cache miss, fetching from server`)
  });

  const addLeadMutation = useMutation({
    mutationFn: apiAddLead,
    onMutate: async (newLead) => {
      // Create optimistic lead with temporary ID
      const optimisticLead: Lead = {
        ...newLead,
        id: `temp_${generateId()}`,
        created_at: new Date().toISOString(),
        last_updated_at: new Date().toISOString(),
        lead_status: "ליד חדש" as LeadStatus,
        free_sample_package_active: false
      };

      // Apply optimistic update
      applyOptimisticUpdate({
        id: optimisticLead.id,
        data: optimisticLead,
        operation: 'create',
        queryKey: ["leads", filters]
      });

      return { optimisticLead };
    },
    onSuccess: (serverLead, variables, context) => {
      // Confirm optimistic update with server data
      if (context?.optimisticLead) {
        confirmUpdate(context.optimisticLead.id, serverLead);
      }
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('leads_');
      
      toast.success("הליד נוצר בהצלחה");
    },
    onError: (err: any, variables, context) => {
      // Revert optimistic update
      if (context?.optimisticLead) {
        revertUpdate(context.optimisticLead.id, err);
      }
      
      console.error("Error adding lead:", err);
      toast.error(err.message || "שגיאה ביצירת הליד");
    }
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<Lead, "id" | "created_at" | "last_updated_at" | "free_sample_package_active">> }) => 
      apiUpdateLead(id, updates),
    onMutate: async ({ id, updates }) => {
      // Get current lead data
      const currentLeads = queryClient.getQueryData<Lead[]>(["leads", filters]) || [];
      const originalLead = currentLeads.find(lead => lead.id === id);
      
      if (originalLead) {
        const optimisticLead = { ...originalLead, ...updates, last_updated_at: new Date().toISOString() };
        
        // Apply optimistic update
        applyOptimisticUpdate({
          id,
          data: optimisticLead,
          operation: 'update',
          queryKey: ["leads", filters],
          originalData: originalLead
        });
      }

      return { originalLead };
    },
    onSuccess: (serverLead, { id }, context) => {
      // Confirm optimistic update
      confirmUpdate(id, serverLead);
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('leads_');
      
      toast.success("הליד עודכן בהצלחה");
    },
    onError: (err: any, { id }, context) => {
      // Revert optimistic update
      revertUpdate(id, err);
      
      console.error("Error updating lead:", err);
      toast.error(err.message || "שגיאה בעדכון הליד");
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: apiDeleteLead,
    onMutate: async (id) => {
      // Get current lead data
      const currentLeads = queryClient.getQueryData<Lead[]>(["leads", filters]) || [];
      const leadToDelete = currentLeads.find(lead => lead.id === id);
      
      if (leadToDelete) {
        // Apply optimistic update
        applyOptimisticUpdate({
          id,
          data: leadToDelete,
          operation: 'delete',
          queryKey: ["leads", filters],
          originalData: leadToDelete
        });
      }

      return { leadToDelete };
    },
    onSuccess: (_, id, context) => {
      // Confirm optimistic update
      confirmUpdate(id);
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('leads_');
      
      toast.success("הליד נמחק בהצלחה");
    },
    onError: (err: any, id, context) => {
      // Revert optimistic update
      revertUpdate(id, err);
      
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
    updateLeadStatus,
    invalidateCache
  };
};
