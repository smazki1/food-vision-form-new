import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, EnhancedLeadsFilter, AIPricingSetting } from '@/types/lead';

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
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
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
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    }
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('lead_id', leadId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
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
