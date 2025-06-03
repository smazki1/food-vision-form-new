import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, EnhancedLeadsFilter, AIPricingSetting } from '@/types/lead';
import { toast } from 'sonner';

export const LEAD_QUERY_KEY = 'enhanced-leads';

export const useEnhancedLeads = (filters: EnhancedLeadsFilter) => {
  return useQuery({
    queryKey: ['enhanced-leads', filters],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*');

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(
          `restaurant_name.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`
        );
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('lead_status', filters.status);
      }

      if (filters.excludeArchived) {
        query = query.neq('lead_status', 'ארכיון');
      }

      if (filters.onlyArchived) {
        query = query.eq('lead_status', 'ארכיון');
      }

      // Always exclude converted leads from the leads list
      // Converted leads should only appear in the clients list
      query = query.neq('lead_status', 'הפך ללקוח');

      const { data, error } = await query.order(filters.sortBy || 'created_at', { 
        ascending: filters.sortDirection === 'asc' 
      });

      if (error) throw error;
      return { data: data as Lead[], total: data?.length || 0 };
    }
  });
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadData: Partial<Lead>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate ALL queries that might contain lead data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      toast.success('ליד חדש נוצר בהצלחה והמערכת עודכנה');
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      toast.error(`שגיאה ביצירת הליד: ${error.message}`);
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidate ALL queries that might contain lead data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails', variables.leadId] });
      
      // If status was updated, also invalidate client queries in case of conversion
      if (variables.updates.lead_status) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    }
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      // First, update any customer_submissions that reference this lead
      const { error: updateError } = await supabase
        .from('customer_submissions')
        .update({ 
          created_lead_id: null,
          lead_id: null 
        })
        .or(`created_lead_id.eq.${leadId},lead_id.eq.${leadId}`);

      if (updateError) {
        console.error('Error updating submissions for lead:', leadId, updateError);
        // Continue with deletion even if update fails, as some references might not exist
      }

      // Now delete the lead
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('lead_id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate ALL queries that might contain lead data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-processed-items'] });
      queryClient.invalidateQueries({ queryKey: ['clientPackageDetails'] });
      
      // Invalidate individual lead queries
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails'] });
      
      toast.success('הליד נמחק בהצלחה והמערכת עודכנה');
    },
    onError: (error: any) => {
      console.error('Error deleting lead:', error);
      toast.error(`שגיאה במחיקת הליד: ${error.message}`);
    }
  });
};

export const useArchiveLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ lead_status: 'ארכיון' as any, is_archived: true })
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
    }
  });
};

export const useRestoreLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ lead_status: 'ליד חדש' as any, is_archived: false })
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
    }
  });
};

export const useConvertLeadToClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: leadId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (clientId, leadId) => {
      // Invalidate ALL queries that might contain lead or client data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-processed-items'] });
      queryClient.invalidateQueries({ queryKey: ['clientPackageDetails'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      
      // Invalidate individual queries
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails'] });
      queryClient.invalidateQueries({ queryKey: ['client-by-user-id'] });
      
      toast.success('הליד הומר ללקוח בהצלחה והמערכת עודכנה!');
    },
    onError: (error: any) => {
      console.error('Error converting lead to client:', error);
      toast.error(`שגיאה בהמרת הליד ללקוח: ${error.message}`);
    }
  });
};

// Direct conversion hook for immediate conversion without confirmation dialogs
export const useDirectConvertLeadToClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', {
        p_lead_id: leadId
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (clientId, leadId) => {
      // Invalidate ALL queries that might contain lead or client data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-processed-items'] });
      queryClient.invalidateQueries({ queryKey: ['clientPackageDetails'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      
      // Invalidate individual queries
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails'] });
      queryClient.invalidateQueries({ queryKey: ['client-by-user-id'] });
      
      toast.success('הליד הומר ללקוח בהצלחה והמערכת עודכנה!');
    },
    onError: (error: any) => {
      console.error('Error converting lead to client:', error);
      toast.error(`שגיאה בהמרת הליד ללקוח: ${error.message}`);
    }
  });
};

export const useAddLeadActivity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, description }: { leadId: string; description: string }) => {
      const { data, error } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: leadId,
          activity_description: description
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-activities'] });
    }
  });
};

export const useAddLeadComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ leadId, comment }: { leadId: string; comment: string }) => {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert({
          lead_id: leadId,
          comment_text: comment
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-comments'] });
    }
  });
};

export const useLeadActivities = (leadId: string) => {
  return useQuery({
    queryKey: ['lead-activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_timestamp', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!leadId
  });
};

export const useAIPricingSettings = () => {
  return useQuery({
    queryKey: ['ai-pricing-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_pricing_settings')
        .select('*')
        .order('setting_name');

      if (error) throw error;
      return data as AIPricingSetting[];
    }
  });
};

export const useUpdateAIPricingSetting = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ settingId, value }: { settingId: string; value: number }) => {
      const { data, error } = await supabase
        .from('ai_pricing_settings')
        .update({ setting_value: value })
        .eq('setting_id', settingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-pricing-settings'] });
    }
  });
};

export const useLeadById = (leadId: string | null) => {
  return useQuery({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      if (!leadId) throw new Error('Lead ID is required');
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) throw error;
      return data as Lead;
    },
    enabled: !!leadId
  });
};

// Bulk delete leads hook
export const useBulkDeleteLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      // Process in smaller batches to avoid URL length limits
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < leadIds.length; i += batchSize) {
        batches.push(leadIds.slice(i, i + batchSize));
      }
      
      // Process each batch sequentially
      for (const batch of batches) {
        // First, update any customer_submissions that reference these leads
        // Set created_lead_id and lead_id to null to avoid foreign key constraint violation
        const { error: updateSubmissionsError } = await supabase
          .from('customer_submissions')
          .update({ 
            created_lead_id: null,
            lead_id: null 
          })
          .in('created_lead_id', batch);

        if (updateSubmissionsError) {
          console.error('Error updating submissions for batch:', batch, updateSubmissionsError);
          throw new Error(`Failed to update submissions: ${updateSubmissionsError.message}`);
        }

        // Also update any submissions that have lead_id reference
        const { error: updateLeadIdError } = await supabase
          .from('customer_submissions')
          .update({ lead_id: null })
          .in('lead_id', batch);

        if (updateLeadIdError) {
          console.error('Error updating lead_id references for batch:', batch, updateLeadIdError);
          throw new Error(`Failed to update lead references: ${updateLeadIdError.message}`);
        }

        // Now delete the leads
        const { error } = await supabase
          .from('leads')
          .delete()
          .in('lead_id', batch);

        if (error) {
          console.error('Bulk delete error for batch:', batch, error);
          throw new Error(`Failed to delete leads: ${error.message}`);
        }
      }
      
      return { deletedCount: leadIds.length };
    },
    onSuccess: (result) => {
      // Invalidate ALL queries that might contain lead data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-processed-items'] });
      queryClient.invalidateQueries({ queryKey: ['clientPackageDetails'] });
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['ai-pricing-settings'] });
      
      // Invalidate individual lead queries that might be cached
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails'] });
      
      // Show success message
      toast.success(`${result.deletedCount} לידים נמחקו בהצלחה והמערכת עודכנה`);
    },
    onError: (error: any) => {
      console.error('Bulk delete error:', error);
      toast.error(`שגיאה במחיקת לידים: ${error.message}`);
    }
  });
};

// Bulk archive leads hook
export const useBulkArchiveLeads = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadIds: string[]) => {
      // Process in smaller batches to avoid URL length limits
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < leadIds.length; i += batchSize) {
        batches.push(leadIds.slice(i, i + batchSize));
      }
      
      // Process each batch sequentially
      for (const batch of batches) {
        const { error } = await supabase
          .from('leads')
          .update({ lead_status: 'ארכיון' as any, is_archived: true })
          .in('lead_id', batch);

        if (error) {
          console.error('Bulk archive error for batch:', batch, error);
          throw new Error(`Failed to archive leads: ${error.message}`);
        }
      }
      
      return { archivedCount: leadIds.length };
    },
    onSuccess: (result) => {
      // Invalidate ALL queries that might contain lead data for complete synchronization
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Invalidate individual lead queries that might be cached
      queryClient.invalidateQueries({ queryKey: ['lead'] });
      queryClient.invalidateQueries({ queryKey: ['leadDetails'] });
      
      // Show success message  
      toast.success(`${result.archivedCount} לידים הועברו לארכיון בהצלחה והמערכת עודכנה`);
    },
    onError: (error: any) => {
      console.error('Bulk archive error:', error);
      toast.error(`שגיאה בהעברת לידים לארכיון: ${error.message}`);
    }
  });
};

// Enhanced update lead hook with automatic conversion logic
export const useUpdateLeadWithConversion = () => {
  const queryClient = useQueryClient();
  const convertToClientMutation = useConvertLeadToClient();
  
  return useMutation({
    mutationFn: async ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => {
      // Check if status is being changed to "הפך ללקוח"
      if (updates.lead_status === 'הפך ללקוח') {
        // Use the RPC function to convert lead to client
        const clientId = await convertToClientMutation.mutateAsync(leadId);
        return { data: { ...updates, client_id: clientId }, converted: true };
      } else {
        // Regular update
        const { data, error } = await supabase
          .from('leads')
          .update(updates)
          .eq('lead_id', leadId)
          .select()
          .single();

        if (error) throw error;
        return { data, converted: false };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
      
      if (result.converted) {
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
    }
  });
};
