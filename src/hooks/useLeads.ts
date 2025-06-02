import { useState } from "react";
import { toast } from "sonner";
import { Lead, LeadStatus, LeadSource, LeadStatusEnum, LeadSourceEnum } from "@/types/lead";
import { EnhancedLeadsFilter, LeadsFilter as LegacyLeadsFilterType } from "@/types/filters";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOptimisticUpdates } from "./useOptimisticUpdates";
import { useCachedQuery } from "./useCachedQuery";
import { cacheService } from "@/services/cacheService";
import { generateId } from "@/utils/generateId";
import { supabase } from '@/integrations/supabase/client';
import {
  LeadActivity,
  LeadComment,
  AIPricingSetting,
  LegacyLead
} from "@/types/lead";
import { leadsAPI } from '@/api/leadsApi';
import { Lead as ModelsLead } from '@/types/models';
import type { LeadStatus as ModelsLeadStatus } from '@/constants/statusTypes';

// === START OF NEW REFACTORED HOOKS (Placed before legacy code) ===

interface UseLeadsOptions {
  statuses?: ModelsLeadStatus[];
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export const useLeads = (options: UseLeadsOptions = {}) => {
  return useQuery<ModelsLead[], Error>({
    queryKey: ['leads', options],
    queryFn: () => leadsAPI.fetchLeads(options),
  });
};

export const useLeadDetails = (leadId: string | null) => {
  return useQuery<ModelsLead, Error>({
    queryKey: ['leadDetails', leadId],
    queryFn: () => {
      if (!leadId) throw new Error('leadId is required to fetch details');
      return leadsAPI.fetchLeadById(leadId!);
    },
    enabled: !!leadId,
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation<ModelsLead, Error, Partial<ModelsLead>>({
    mutationFn: (leadData: Partial<ModelsLead>) => leadsAPI.createLead(leadData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      if (data && data.lead_id) {
        queryClient.setQueryData(['leadDetails', data.lead_id], data);
      }
      toast.success('ליד חדש נוצר בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Error creating lead:', error);
      toast.error(`שגיאה ביצירת ליד: ${error.message}`);
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation<ModelsLead, Error, { leadId: string; updates: Partial<ModelsLead> }>({
    mutationFn: ({ leadId, updates }) => leadsAPI.updateLead(leadId, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
      if (data) {
        queryClient.setQueryData(['leadDetails', variables.leadId], data);
      }
      toast.success('הליד עודכן בהצלחה');
    },
    onError: (error: Error) => {
      console.error('Error updating lead:', error);
      toast.error(`שגיאה בעדכון הליד: ${error.message}`);
    }
  });
};

export const useConvertLeadToClient = () => {
  const queryClient = useQueryClient();
  return useMutation<
    { clientId: string | null; success: boolean },
    Error,
    { leadId: string; userId: string }
  >({
    mutationFn: async ({ leadId, userId }: { leadId: string; userId: string }) => {
      const result = await leadsAPI.convertToClient(leadId, userId);
      return { clientId: result.client_id, success: !!result.client_id };
    },
    onSuccess: (result, variables) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        toast.success('הליד הומר ללקוח בהצלחה');
      } else {
        toast.error('שגיאה: לא ניתן להמיר את הליד ללקוח.');
      }
    },
    onError: (error: Error) => {
      console.error('Error converting lead to client:', error);
      toast.error(`שגיאה בהמרת הליד ללקוח: ${error.message}`);
    }
  });
};

export const useArchiveLead = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (leadId: string) => {
      await leadsAPI.archiveLead(leadId);
      return true; // Assume success if no error is thrown
    },
    onSuccess: (success, leadId) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', leadId] });
        toast.success('הליד הועבר לארכיון בהצלחה');
      } else {
        toast.error('שגיאה: לא ניתן להעביר את הליד לארכיון.');
      }
    },
    onError: (error: Error) => {
      console.error('Error archiving lead:', error);
      toast.error(`שגיאה בהעברת הליד לארכיון: ${error.message}`);
    }
  });
};

export const useRestoreLeadFromArchive = () => {
  const queryClient = useQueryClient();
  return useMutation<
    boolean, 
    Error, 
    { leadId: string; newStatus?: ModelsLeadStatus }
  >({
    mutationFn: async ({ leadId, newStatus }) => {
      await leadsAPI.restoreFromArchive(leadId, newStatus);
      return true; // Assume success if no error is thrown
    },
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
        toast.success('הליד שוחזר מהארכיון בהצלחה');
      } else {
        toast.error('שגיאה: לא ניתן לשחזר את הליד מהארכיון.');
      }
    },
    onError: (error: Error) => {
      console.error('Error restoring lead from archive:', error);
      toast.error(`שגיאה בשחזור הליד מהארכיון: ${error.message}`);
    }
  });
};

// === END OF NEW REFACTORED HOOKS ===

export const LEAD_QUERY_KEY = 'enhanced_leads';

/*
// Legacy useLeads hook - renamed to useLegacyLeads for backward compatibility during migration
export const useLegacyLeads = (filters?: LegacyLeadsFilterType) => {
  const queryClient = useQueryClient();
  const { applyOptimisticUpdate, confirmUpdate, revertUpdate } = useOptimisticUpdates<LegacyLead>();
  
  // Create a serialized cache key from filters
  const filtersCacheKey = filters ? JSON.stringify(filters) : 'no-filters';
  
  // Use cached query for leads data
  const {
    data: leads = [],
    isLoading: loading,
    error,
    invalidateCache
  } = useCachedQuery({
    queryKey: ["legacy_leads", filters],
    queryFn: () => fetchLeads(filters), // This will cause an error as fetchLeads is not defined here anymore
    cacheKey: `legacy_leads_${filtersCacheKey}`,
    cacheTTL: 3 * 60 * 1000, // 3 minutes for leads (they change frequently)
    backgroundRefresh: true,
    onCacheHit: (data) => console.log(`[CACHE] Legacy leads cache hit: ${data.length} leads`),
    onCacheMiss: () => console.log(`[CACHE] Legacy leads cache miss, fetching from server`)
  });

  const addLeadMutation = useMutation({
    mutationFn: apiAddLead, // This will cause an error
    onMutate: async (newLead) => {
      const optimisticLead: LegacyLead = {
        ...(newLead as any), // Added as any to suppress immediate TS error, but this is problematic
        id: `temp_${generateId()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lead_status: "ליד חדש" as LeadStatus,
        free_sample_package_active: false,
        restaurant_name: (newLead as any).restaurant_name || '',
        contact_name: (newLead as any).contact_name || '',
        phone: (newLead as any).phone || '',
        email: (newLead as any).email || '',
        lead_source: (newLead as any).lead_source || null,
        notes: (newLead as any).notes || '',
      };

      // Apply optimistic update
      applyOptimisticUpdate({
        id: optimisticLead.id,
        data: optimisticLead,
        operation: 'create',
        queryKey: ["legacy_leads", filtersCacheKey]
      });

      return { optimisticLead };
    },
    onSuccess: (serverLead, variables, context) => {
      // Confirm optimistic update with server data
      if (context?.optimisticLead) {
        confirmUpdate(context.optimisticLead.id, serverLead as LegacyLead);
      }
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('legacy_leads_');
      
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
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Omit<LegacyLead, "id" | "created_at" | "updated_at" | "free_sample_package_active">>) => 
      apiUpdateLead(id, updates), // This will cause an error
    onMutate: async ({ id, updates }) => {
      // Get current lead data
      const currentLeads = queryClient.getQueryData<LegacyLead[]>(["legacy_leads", filters]) || [];
      const originalLead = currentLeads.find(lead => lead.id === id);
      
      if (originalLead) {
        const optimisticLead = { ...originalLead, ...updates, updated_at: new Date().toISOString() };
        
        // Apply optimistic update
        applyOptimisticUpdate({
          id,
          data: optimisticLead,
          operation: 'update',
          queryKey: ["legacy_leads", filtersCacheKey],
          originalData: originalLead
        });
      }

      return { originalLead };
    },
    onSuccess: (serverLead, { id }, context) => {
      // Confirm optimistic update
      confirmUpdate(id, serverLead as LegacyLead);
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('legacy_leads_');
      
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
    mutationFn: apiDeleteLead, // This will cause an error
    onMutate: async (id) => {
      // Get current lead data
      const currentLeads = queryClient.getQueryData<LegacyLead[]>(["legacy_leads", filters]) || [];
      const leadToDelete = currentLeads.find(lead => lead.id === id);
      
      if (leadToDelete) {
        // Apply optimistic update
        applyOptimisticUpdate({
          id: id as string, // Cast to string
          data: leadToDelete,
          operation: 'delete',
          queryKey: ["legacy_leads", filtersCacheKey],
          originalData: leadToDelete
        });
      }

      return { leadToDelete };
    },
    onSuccess: (_, id, context) => {
      // Confirm optimistic update
      confirmUpdate(id as string); // Cast to string
      
      // Invalidate cache
      invalidateCache();
      cacheService.invalidatePattern('legacy_leads_');
      
      toast.success("הליד נמחק בהצלחה");
    },
    onError: (err: any, id, context) => {
      // Revert optimistic update
      revertUpdate(id as string, err); // Cast to string
      
      console.error("Error deleting lead:", err);
      toast.error(err.message || "שגיאה במחיקת הליד");
    }
  });

  const addLead = async (newLead: Omit<LegacyLead, "id" | "created_at" | "updated_at" | "lead_status" | "free_sample_package_active">) => {
    return addLeadMutation.mutateAsync(newLead as any); // Added as any
  };

  const updateLead = async (id: string, updates: Partial<Omit<LegacyLead, "id" | "created_at" | "updated_at" | "free_sample_package_active">>) => {
    return updateLeadMutation.mutateAsync({ id, updates });
  };

  const deleteLead = async (id: string) => {
    return deleteLeadMutation.mutateAsync(id as any); // Added as any
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

// Function to fetch leads with filters
export const fetchEnhancedLeads = async (filters?: EnhancedLeadsFilter) => {
  let query = supabase
    .from('leads')
    .select('*');
  
  // Apply filters
  // if (filters) {
  //   // Apply status filter
  //   if (filters.status && filters.status !== 'all') {
  //     query = query.eq('status', filters.status);
  //   }
    
  //   // Apply source filter
  //   if (filters.leadSource && filters.leadSource !== 'all') {
  //     query = query.eq('lead_source', filters.leadSource);
  //   }
    
  //   // Apply archived filter
  //   if (filters.excludeArchived) {
  //     query = query.neq('status', LeadStatusEnum.ARCHIVED);
  //   }
    
  //   if (filters.onlyArchived) {
  //     query = query.eq('status', LeadStatusEnum.ARCHIVED);
  //   }
    
  //   // Apply date filter
  //   if (filters.dateFilter && filters.dateFilter !== 'all') {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0);
      
  //     if (filters.dateFilter === 'today') {
  //       const tomorrow = new Date(today);
  //       tomorrow.setDate(tomorrow.getDate() + 1);
        
  //       query = query
  //         .gte('created_at', today.toISOString())
  //         .lt('created_at', tomorrow.toISOString());
  //     } else if (filters.dateFilter === 'this-week') {
  //       const startOfWeek = new Date(today);
  //       startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        
  //       const endOfWeek = new Date(startOfWeek);
  //       endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (Saturday)
        
  //       query = query
  //         .gte('created_at', startOfWeek.toISOString())
  //         .lt('created_at', endOfWeek.toISOString());
  //     } else if (filters.dateFilter === 'this-month') {
  //       const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  //       const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
  //       query = query
  //         .gte('created_at', startOfMonth.toISOString())
  //         .lte('created_at', endOfMonth.toISOString());
  //     }
  //   }
    
  //   // Apply reminders filter
  //   if (filters.onlyReminders) {
  //     query = query.not('next_follow_up_date', 'is', null);
  //   }
    
  //   // Apply reminders for today filter
  //   if (filters.remindersToday) {
  //     const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
  //     query = query.eq('next_follow_up_date', today);
  //   }
    
  //   // Apply search term
  //   if (filters.searchTerm) {
  //     const searchTerm = `%${filters.searchTerm}%`;
  //     query = query.or(
  //       `restaurant_name.ilike.${searchTerm},contact_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`
  //     );
  //   }
    
  //   // Apply sorting
  //   if (filters.sortBy) {
  //     query = query.order(filters.sortBy, { 
  //       ascending: filters.sortDirection === 'asc' 
  //     });
  //   } else {
  //     // Default sort by created_at descending
  //     query = query.order('created_at', { ascending: false });
  //   }
  // } else {
  //   // Default: exclude archived leads and sort by created_at descending
  //   // query = query
  //   //   .neq('status', LeadStatusEnum.ARCHIVED)
  //   //   .order('created_at', { ascending: false });
  // }

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase query error in fetchEnhancedLeads (simplified for debugging):", error);
    throw error;
  }
  return { data: data || [], count }; // Ensure data is always an array
};

// Function to fetch a single lead with all related data
export const fetchLeadDetails = async (leadId: string) => {
  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_id', leadId)
    .single();
  
  if (leadError) throw leadError;
  
  // Fetch activities
  const { data: activities, error: activitiesError } = await supabase
    .from('lead_activity_log')
    .select('*')
    .eq('lead_id', leadId)
    .order('activity_timestamp', { ascending: false });
  
  if (activitiesError) throw activitiesError;
  
  // Fetch comments
  const { data: comments, error: commentsError } = await supabase
    .from('lead_comments')
    .select('*')
    .eq('lead_id', leadId)
    .order('comment_timestamp', { ascending: false });
  
  if (commentsError) throw commentsError;
  
  return {
    ...lead,
    activities,
    comments
  };
};

// Function to fetch AI pricing settings
export const fetchAIPricingSettings = async () => {
  const { data, error } = await supabase
    .from('ai_pricing_settings')
    .select('*');
  
  if (error) throw error;
  return data as AIPricingSetting[];
};

// Hook for fetching AI pricing settings
export const useAIPricingSettings = () => {
  return useQuery({
    queryKey: [LEAD_QUERY_KEY, 'ai-pricing-settings'],
    queryFn: fetchAIPricingSettings,
  });
};

// Mutation to add a comment to a lead
export const useAddLeadComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, commentText }: { leadId: string, commentText: string }) => {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: leadId,
          comment_text: commentText
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Log activity
      await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_activity_description: 'Comment added to lead.'
      });
      
      return data as LeadComment;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY, 'details', data.lead_id] });
      toast.success('ההערה נוספה בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error adding comment:', error);
      toast.error(error.message || 'שגיאה בהוספת הערה');
    }
  });
};

// Mutation to add a manual activity log entry
export const useAddLeadActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, activityDescription }: { leadId: string, activityDescription: string }) => {
      const { data, error } = await supabase.rpc('log_lead_activity', {
        p_lead_id: leadId,
        p_activity_description: activityDescription
      });
      
      if (error) throw error;
      return leadId;
    },
    onSuccess: (leadId) => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY, 'details', leadId] });
      toast.success('הפעילות נרשמה בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error adding activity:', error);
      toast.error(error.message || 'שגיאה ברישום פעילות');
    }
  });
};

// Mutation to update AI pricing settings
export const useUpdateAIPricingSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ settingName, settingValue }: { settingName: string, settingValue: number }) => {
      const { data, error } = await supabase
        .from('ai_pricing_settings')
        .update({ setting_value: settingValue })
        .eq('setting_name', settingName)
        .select()
        .single();
      
      if (error) throw error;
      return data as AIPricingSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY, 'ai-pricing-settings'] });
      toast.success('הגדרות מחירי AI עודכנו בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating AI pricing settings:', error);
      toast.error(error.message || 'שגיאה בעדכון הגדרות מחירי AI');
    }
  });
};

// Function to get costs report data
export const fetchCostsReport = async (dateRange?: { start: string, end: string }) => {
  let query = supabase
    .from('leads')
    .select(`
      lead_id,
      restaurant_name,
      status,
      ai_trainings_count,
      ai_training_cost_per_unit,
      ai_prompts_count,
      ai_prompt_cost_per_unit,
      total_ai_costs,
      revenue_from_lead_local,
      revenue_from_lead_usd,
      roi,
      created_at
    `);
  
  if (dateRange) {
    // Apply date filter
    const { start, end } = dateRange;
    query = query.gte('created_at', start).lte('created_at', end);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Supabase query error in fetchCostsReport:", error);
    throw error;
  }
  return { data: data || [], count }; // Ensure data is always an array
};
*/