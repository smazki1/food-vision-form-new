import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Lead,
  LeadActivity,
  LeadComment,
  LeadStatusEnum,
  LeadSourceEnum,
  AIPricingSetting,
  mapLeadStatusToHebrew,
  mapLeadSourceToHebrew,
  mapHebrewToLeadStatusEnum,
  mapHebrewToLeadSourceEnum,
  LEAD_STATUS_DISPLAY
} from "@/types/lead";
import { EnhancedLeadsFilter } from "@/types/filters";

export const LEAD_QUERY_KEY = 'enhancedLeads';
const SINGLE_LEAD_QUERY_KEY_PREFIX = 'enhancedLead';

interface EnhancedLeadsData {
  data: Lead[];
  total: number;
}

export interface CostsReportData {
    totalLeads: number;
    totalAiCosts: number;
}

const applyFilters = (query: any, filters: EnhancedLeadsFilter) => {
  let filteredQuery = query;
  
  if (filters.searchTerm) {
    filteredQuery = filteredQuery.or(
      `restaurant_name.ilike.%${filters.searchTerm}%,contact_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`
    );
  }
  
  if (filters.status && filters.status !== 'all') {
    const hebrewStatus = mapLeadStatusToHebrew(filters.status);
    if (hebrewStatus) {
      filteredQuery = filteredQuery.eq('lead_status', hebrewStatus);
    }
  }
  
  if (filters.leadSource && filters.leadSource !== 'all') {
    const hebrewSource = mapLeadSourceToHebrew(filters.leadSource);
    if (hebrewSource) {
      filteredQuery = filteredQuery.eq('lead_source', hebrewSource);
    }
  }
  
  if (filters.dateFilter === 'today') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    filteredQuery = filteredQuery
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());
  } else if (filters.dateFilter === 'this-week') {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    
    filteredQuery = filteredQuery
        .gte('created_at', startOfWeek.toISOString())
        .lt('created_at', endOfWeek.toISOString());
  } else if (filters.dateFilter === 'this-month') {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    endOfMonth.setHours(0,0,0,0);

    filteredQuery = filteredQuery
        .gte('created_at', startOfMonth.toISOString())
        .lt('created_at', endOfMonth.toISOString());
  }
  
  if (filters.onlyReminders) {
    filteredQuery = filteredQuery.not('next_follow_up_date', 'is', null);
  }
  
  if (filters.remindersToday) {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];

    filteredQuery = filteredQuery
      .eq('next_follow_up_date', todayDateString);
  }
  
  if (filters.excludeArchived) {
    const validNonArchivedHebrewStatuses = [
      'ליד חדש', 
      'פנייה ראשונית בוצעה', 
      'מעוניין', 
      'לא מעוניין', 
      'נקבעה פגישה/שיחה', 
      'הדגמה בוצעה', 
      'הצעת מחיר נשלחה', 
      'ממתין לתשובה', 
      'הפך ללקוח'
    ];
    query = query.in('lead_status', validNonArchivedHebrewStatuses);
  }
  
  if (filters.onlyArchived) {
    const hebrewArchived = mapLeadStatusToHebrew(LeadStatusEnum.ARCHIVED);
    if (hebrewArchived) {
      filteredQuery = filteredQuery.eq('lead_status', hebrewArchived);
    }
  }
  
  return filteredQuery;
};

export const fetchEnhancedLeads = async (filters?: EnhancedLeadsFilter): Promise<EnhancedLeadsData> => {
  const PAGE_SIZE = filters?.pageSize || 10;
  const currentPage = filters?.page || 1;
  const rangeFrom = (currentPage - 1) * PAGE_SIZE;
  const rangeTo = rangeFrom + PAGE_SIZE - 1;

  const selectFields = 
    'lead_id,\n' +
    'restaurant_name,\n' +
    'contact_name,\n' +
    'phone,\n' +
    'email,\n' +
    'website_url,\n' +
    'address,\n' +
    'lead_status,\n' +
    'ai_trainings_count,\n' +
    'ai_training_cost_per_unit,\n' +
    'ai_prompts_count,\n' +
    'ai_prompt_cost_per_unit,\n' +
    'total_ai_costs,\n' +
    'revenue_from_lead_local,\n' +
    'exchange_rate_at_conversion,\n' +
    'revenue_from_lead_usd,\n' +
    'roi,\n' +
    'lead_source,\n' +
    'created_at,\n' +
    'updated_at,\n' +
    'next_follow_up_date,\n' +
    'next_follow_up_notes,\n' +
    'notes,\n' +
    'client_id,\n' +
    'free_sample_package_active';

  let query = supabase.from('leads').select(selectFields, { count: 'exact' });

  if (filters) {
    if (filters.searchTerm) {
      const searchPattern = `%${filters.searchTerm}%`;
      query = query.or(
        `restaurant_name.ilike.${searchPattern},contact_name.ilike.${searchPattern},email.ilike.${searchPattern},phone.ilike.${searchPattern}`
      );
    }
    if (filters.status && filters.status !== 'all') {
      const hebrewStatus = mapLeadStatusToHebrew(filters.status);
      if (hebrewStatus) query = query.eq('lead_status', hebrewStatus);
    }
    if (filters.leadSource && filters.leadSource !== 'all') {
      const hebrewSource = mapLeadSourceToHebrew(filters.leadSource);
      if (hebrewSource) query = query.eq('lead_source', hebrewSource);
    }
    if (filters.excludeArchived) {
      const archivedStatusHebrew = mapLeadStatusToHebrew(LeadStatusEnum.ARCHIVED);
      if (archivedStatusHebrew) {
        query = query.neq('lead_status', archivedStatusHebrew);
      }
    }
    if (filters.onlyArchived) {
      const hebrewArchived = mapLeadStatusToHebrew(LeadStatusEnum.ARCHIVED);
      if (hebrewArchived) query = query.eq('lead_status', hebrewArchived);
    }

    if (filters.dateFilter && filters.dateFilter !== 'all') {
      const today = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;

      if (filters.dateFilter === 'today') {
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 1));
      } else if (filters.dateFilter === 'this-week') {
        const dayOfWeek = today.getDay();
        startDate = new Date(new Date(today).setDate(today.getDate() - dayOfWeek));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(new Date(startDate).setDate(startDate.getDate() + 7));
      } else if (filters.dateFilter === 'this-month') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      }
      if (startDate && endDate) {
        query = query.gte('created_at', startDate.toISOString());
        query = query.lt('created_at', endDate.toISOString());
      }
    }
    if (filters.onlyReminders) {
      query = query.not('next_follow_up_date', 'is', null);
    }
    if (filters.remindersToday) {
      const todayDateString = new Date().toISOString().split('T')[0];
      query = query.eq('next_follow_up_date', todayDateString);
    }

    if (filters.sortBy) {
      query = query.order(filters.sortBy, {
        ascending: filters.sortDirection === 'asc',
      });
    }
  }
  
  query = query.range(rangeFrom, rangeTo);

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching leads:", error);
    toast.error(`Error fetching leads: ${error.message}`);
    throw error;
  }

  const leads: Lead[] = Array.isArray(data) ? data as unknown as Lead[] : [];

  return { data: leads, total: count || 0 };
};

export const useEnhancedLeads = (filters: EnhancedLeadsFilter) => {
  return useQuery<EnhancedLeadsData, Error>({
    queryKey: [LEAD_QUERY_KEY, filters],
    queryFn: () => fetchEnhancedLeads(filters),
    placeholderData: { data: [], total: 0 },
  });
};

export const getLeadStatusDisplay = (statusEnum?: LeadStatusEnum): string => {
  if (!statusEnum) return 'N/A';
  return LEAD_STATUS_DISPLAY[statusEnum] || statusEnum;
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, Partial<Lead>>({
    mutationFn: async (newLeadData) => {
      let finalLeadData = { ...newLeadData };
      if (newLeadData.lead_status) {
        if (typeof newLeadData.lead_status === 'string' && LEAD_STATUS_DISPLAY[newLeadData.lead_status as LeadStatusEnum]) {
          // Already a valid LeadStatusEnum key, no action needed
        } else {
          const mappedStatus = mapHebrewToLeadStatusEnum(newLeadData.lead_status as string);
          if (mappedStatus) {
            finalLeadData.lead_status = mappedStatus;
          } else {
            console.warn(`Unrecognized lead status: ${newLeadData.lead_status}, defaulting to NEW`);
            finalLeadData.lead_status = LeadStatusEnum.NEW;
          }
        }
      } else {
        finalLeadData.lead_status = LeadStatusEnum.NEW; 
      }
      
      const { data, error } = await supabase
        .from('leads')
        .insert([finalLeadData])
        .select()
        .single();

      if (error) {
        toast.error(`Error creating lead: ${error.message}`);
        throw error;
      }
      return data as Lead;
    },
    onSuccess: () => {
        toast.success("Lead created successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
    },
    onError: (error) => {
        console.error("Mutation error on create lead:", error);
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation<Lead, Error, Partial<Lead> & { lead_id: string }>({
    mutationFn: async (leadToUpdate) => {
      const { lead_id, ...updateData } = leadToUpdate;
      
      let finalUpdateData = { ...updateData };
      if (updateData.lead_status && typeof updateData.lead_status === 'string' && !LEAD_STATUS_DISPLAY[updateData.lead_status as LeadStatusEnum]) {
        const mappedStatus = mapHebrewToLeadStatusEnum(updateData.lead_status);
        if (mappedStatus) {
          finalUpdateData.lead_status = mappedStatus;
        } else {
           console.warn(`Unrecognized lead status for update: ${updateData.lead_status}`);
           delete finalUpdateData.lead_status;
        }
      }

      const { data, error } = await supabase
        .from('leads')
        .update(finalUpdateData)
        .eq('lead_id', lead_id)
        .select()
        .single();

      if (error) {
        toast.error(`Error updating lead: ${error.message}`);
        throw error;
      }
      return data as Lead;
    },
    onSuccess: (updatedLead) => {
        toast.success("Lead updated successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        if (updatedLead && updatedLead.lead_id) {
          queryClient.invalidateQueries({ queryKey: [SINGLE_LEAD_QUERY_KEY_PREFIX, updatedLead.lead_id] });
        }
    },
  });
};

export const useArchiveLead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (leadId) => {
      const hebrewArchivedStatus = mapLeadStatusToHebrew(LeadStatusEnum.ARCHIVED);
      if (!hebrewArchivedStatus) {
        throw new Error("Archived status not mapped correctly.");
      }
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: hebrewArchivedStatus,
          archived_at: new Date().toISOString()
        }) 
        .eq('lead_id', leadId);

      if (error) {
        toast.error(`Error archiving lead: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, leadId) => {
        toast.success("Lead archived successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [SINGLE_LEAD_QUERY_KEY_PREFIX, leadId] });
    },
  });
};

export const useRestoreLead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { leadId: string; newStatus?: LeadStatusEnum }>({
    mutationFn: async ({ leadId, newStatus = LeadStatusEnum.NEW }) => {
      const hebrewNewStatus = mapLeadStatusToHebrew(newStatus);
      if (!hebrewNewStatus) {
         throw new Error("New status for restore not mapped correctly.");
      }
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: hebrewNewStatus,
          archived_at: null
        })
        .eq('lead_id', leadId);

      if (error) {
        toast.error(`Error restoring lead: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
        toast.success("Lead restored successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [SINGLE_LEAD_QUERY_KEY_PREFIX, leadId] });
    },
  });
};

export const useDeleteLead = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (leadId) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('lead_id', leadId);

      if (error) {
        toast.error(`Error deleting lead: ${error.message}`);
        throw error;
      }
    },
    onSuccess: (_, leadId) => {
        toast.success("Lead deleted successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        queryClient.removeQueries({ queryKey: [SINGLE_LEAD_QUERY_KEY_PREFIX, leadId]});
    },
  });
};

export const useConvertLeadToClient = () => {
  const queryClient = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: async (leadId) => {
      const { data, error } = await supabase.rpc('convert_lead_to_client', { p_lead_id: leadId });

      if (error) {
        toast.error(`Error converting lead to client: ${error.message}`);
        throw error;
      }
      return data;
    },
    onSuccess: (data, leadId) => {
        toast.success("Lead converted to client successfully!");
        queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        queryClient.invalidateQueries({ queryKey: [SINGLE_LEAD_QUERY_KEY_PREFIX, leadId] });
    },
  });
};

export const useAddLeadComment = () => {
  const queryClient = useQueryClient();
  return useMutation<LeadComment, Error, { lead_id: string; comment_text: string; user_id?: string }>({
    mutationFn: async (commentData) => {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert([{ ...commentData, comment_timestamp: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data as LeadComment;
    },
    onSuccess: (data, variables) => {
        toast.success('Comment added!');
        queryClient.invalidateQueries({ queryKey: ['leadComments', variables.lead_id] });
    },
    onError: (error) => {
        toast.error(`Failed to add comment: ${error.message}`);
    }
  });
};

export const useAddLeadActivity = () => {
  const queryClient = useQueryClient();
  return useMutation<LeadActivity, Error, { lead_id: string; activity_description: string; user_id?: string }>({
    mutationFn: async (activityData) => {
      const { data, error } = await supabase
        .from('lead_activities')
        .insert([{ ...activityData, activity_timestamp: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      return data as LeadActivity;
    },
    onSuccess: (data, variables) => {
        toast.success('Activity logged!');
        queryClient.invalidateQueries({ queryKey: ['leadActivities', variables.lead_id] });
    },
    onError: (error) => {
        toast.error(`Failed to log activity: ${error.message}`);
    }
  });
};

export const fetchLeadComments = async (leadId: string): Promise<LeadComment[]> => {
    const { data, error } = await supabase
        .from('lead_comments')
        .select('*')
        .eq('lead_id', leadId)
        .order('comment_timestamp', { ascending: false });

    if (error) throw error;
    return data as LeadComment[];
};

export const useLeadComments = (leadId: string | null) => {
    return useQuery<LeadComment[], Error>({
        queryKey: ['leadComments', leadId],
        queryFn: () => leadId ? fetchLeadComments(leadId) : Promise.resolve([]),
        enabled: !!leadId,
    });
};

export const fetchLeadActivities = async (leadId: string): Promise<LeadActivity[]> => {
    const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_timestamp', { ascending: false });

    if (error) throw error;
    return data as LeadActivity[];
};

export const useLeadActivities = (leadId: string | null) => {
    return useQuery<LeadActivity[], Error>({
        queryKey: ['leadActivities', leadId],
        queryFn: () => leadId ? fetchLeadActivities(leadId) : Promise.resolve([]),
        enabled: !!leadId,
    });
}; 