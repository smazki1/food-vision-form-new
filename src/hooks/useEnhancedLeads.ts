
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead, EnhancedLeadsFilter, AIPricingSetting } from '@/types/lead';

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
