
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsAPI } from '@/api/leadsApi';
import { Lead } from '@/types/models';
import { LeadStatus, LeadSource } from '@/constants/statusTypes';
import { toast } from 'sonner';

interface UseLeadsOptions {
  searchTerm?: string;
  leadStatus?: LeadStatus | "all";
  leadSource?: LeadSource | "all";
  dateFilter?: "today" | "this-week" | "this-month" | "all";
  onlyReminders?: boolean;
  remindersToday?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export const useLeads = (options: UseLeadsOptions = {}) => {
  const queryClient = useQueryClient();
  
  const { 
    searchTerm = "",
    leadStatus = "all",
    leadSource = "all",
    dateFilter = "all",
    onlyReminders = false,
    remindersToday = false,
    sortBy = "created_at",
    sortDirection = "desc"
  } = options;

  // Build query parameters
  const queryParams = {
    statuses: leadStatus !== "all" ? [leadStatus as LeadStatus] : undefined,
    searchTerm: searchTerm || undefined,
    sortBy,
    sortDirection,
    page: 0,
    pageSize: 50
  };

  const { data: leads = [], isLoading: loading, error } = useQuery({
    queryKey: ['leads', queryParams],
    queryFn: () => leadsAPI.fetchLeads(queryParams),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
  });

  const addLead = useMutation({
    mutationFn: (leadData: Partial<Lead>) => leadsAPI.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('ליד חדש נוצר בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      toast.error('שגיאה ביצירת ליד חדש');
    }
  });

  const updateLead = useMutation({
    mutationFn: ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => 
      leadsAPI.updateLead(leadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('הליד עודכן בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast.error('שגיאה בעדכון הליד');
    }
  });

  const deleteLead = useMutation({
    mutationFn: (leadId: string) => leadsAPI.archiveLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('הליד הועבר לארכיון');
    },
    onError: (error: any) => {
      console.error('Error archiving lead:', error);
      toast.error('שגיאה בהעברת הליד לארכיון');
    }
  });

  return {
    leads: Array.isArray(leads) ? leads : [],
    loading,
    error,
    addLead: addLead.mutateAsync,
    updateLead: updateLead.mutateAsync,
    deleteLead: deleteLead.mutateAsync,
  };
};

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadData: Partial<Lead>) => leadsAPI.createLead(leadData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('ליד חדש נוצר בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      toast.error('שגיאה ביצירת ליד חדש');
    }
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, updates }: { leadId: string; updates: Partial<Lead> }) => 
      leadsAPI.updateLead(leadId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('הליד עודכן בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error updating lead:', error);
      toast.error('שגיאה בעדכון הליד');
    }
  });
};

export const useConvertLeadToClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, userId }: { leadId: string; userId: string }) => 
      leadsAPI.convertToClient(leadId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('הליד הומר ללקוח בהצלחה');
    },
    onError: (error: any) => {
      console.error('Error converting lead to client:', error);
      toast.error('שגיאה בהמרת הליד ללקוח');
    }
  });
};

export const useArchiveLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (leadId: string) => leadsAPI.archiveLead(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('הליד הועבר לארכיון');
    },
    onError: (error: any) => {
      console.error('Error archiving lead:', error);
      toast.error('שגיאה בהעברת הליד לארכיון');
    }
  });
};

export const useRestoreLeadFromArchive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leadId, newStatus }: { leadId: string; newStatus?: LeadStatus }) => 
      leadsAPI.restoreFromArchive(leadId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('הליד שוחזר מהארכיון');
    },
    onError: (error: any) => {
      console.error('Error restoring lead from archive:', error);
      toast.error('שגיאה בשחזור הליד מהארכיון');
    }
  });
};
