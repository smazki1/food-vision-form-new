import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { Submission as ProcessedItem, SubmissionStatus } from "@/api/submissionApi";
import { toast } from 'sonner';
import { 
  EnhancedSubmission, 
  SubmissionComment, 
  SubmissionCommentType,
  SubmissionStatusKey 
} from '@/types/submission';
import { leadsAPI } from '@/api/leadsApi';

export interface ClientPackageInfo {
  packageName: string | null;
  totalSubmissions: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export function useSubmissions() {
  const { clientId: clientAuthClientId, isAuthenticated: clientAuthIsAuthenticated, clientRecordStatus } = useClientAuth();
  const { user, clientId: unifiedClientId, isAuthenticated: unifiedIsAuthenticated, loading: unifiedLoading, initialized } = useUnifiedAuth();
  
  const effectiveClientId = unifiedClientId || clientAuthClientId;
  
  const queryClient = useQueryClient();
  
  console.log("[useSubmissions] Hook initialized with dual auth sources:", { 
    clientAuthClientId, 
    unifiedClientId, 
    effectiveClientId,
    clientAuthIsAuthenticated, 
    unifiedIsAuthenticated,
    clientRecordStatus,
    unifiedLoading,
    initialized,
    userEmail: user?.email,
    timestamp: Date.now()
  });

  const queryEnabled = !!effectiveClientId && unifiedIsAuthenticated && initialized && !unifiedLoading;

  const {
    data: processedItems = [], 
    isLoading: loading,
    error,
    refetch
  } = useQuery<ProcessedItem[], Error>({
    queryKey: ["client-processed-items", effectiveClientId], 
    queryFn: async () => {
      console.log("[useSubmissions] queryFn triggered. Using effectiveClientId:", effectiveClientId, "Is authenticated:", unifiedIsAuthenticated);
      if (!effectiveClientId) {
        console.warn("[useSubmissions] queryFn: No effectiveClientId, returning empty array.");
        return [];
      }
      if (!unifiedIsAuthenticated) {
        console.warn("[useSubmissions] queryFn: User not unifiedAuthenticated, returning empty array.");
        return [];
      }
      
      try {
        console.log(`[useSubmissions] queryFn: Fetching submissions for effectiveClientId: ${effectiveClientId}`);
        
        const { data, error: queryError } = await supabase
          .from("customer_submissions")
          .select(`
            submission_id,
            client_id,
            original_item_id,
            item_type,
            item_name_at_submission,
            assigned_package_id_at_submission,
            submission_status,
            uploaded_at,
            original_image_urls,
            processed_image_urls,
            main_processed_image_url,
            edit_history,
            edit_count,
            final_approval_timestamp,
            internal_team_notes,
            assigned_editor_id,
            target_completion_date,
            priority,
            created_lead_id,
            submission_contact_name,
            submission_contact_email,
            submission_contact_phone,
            lead_id,
            created_at
          `)
          .eq("client_id", effectiveClientId)
          .order("uploaded_at", { ascending: false });
          
        if (queryError) {
          console.error("[useSubmissions] Error fetching processed items:", queryError);
          throw new Error(`Failed to fetch submissions: ${queryError.message}`);
        }
        
        const submissions = data as ProcessedItem[];
        console.log("[useSubmissions] queryFn: Successfully fetched data for effectiveClientId:", effectiveClientId, "Data count:", submissions?.length);
        return submissions;
        
      } catch (err) {
        console.error("[useSubmissions] Exception in query function:", err);
        throw err;
      }
    },
    enabled: queryEnabled
  });

  const { data: packageDetails, isLoading: packageDetailsLoading } = useQuery<ClientPackageInfo | null, Error>({
    queryKey: ['clientPackageDetails', effectiveClientId],
    queryFn: async () => {
      if (!effectiveClientId) return null;

      console.log("[useSubmissions] Fetching package details for client:", effectiveClientId);

      let packageIdToQuery: string | null = null;
      if (processedItems && processedItems.length > 0 && processedItems[0].assigned_package_id_at_submission) {
        packageIdToQuery = processedItems[0].assigned_package_id_at_submission;
        console.log("[useSubmissions] Using package ID from most recent submission:", packageIdToQuery);
      } else {
        console.log("[useSubmissions] No package ID on submission, trying to fetch current_package_id from clients table for client:", effectiveClientId);
        try {
          const { data: clientPackageData, error: clientPackageError } = await supabase
            .from('clients')
            .select('current_package_id')
            .eq('client_id', effectiveClientId)
            .single();

          if (clientPackageError) {
            console.error("[useSubmissions] Error fetching current_package_id from client:", clientPackageError);
            // Do not throw, let it proceed to fetch package details with null if needed
          } else if (clientPackageData?.current_package_id) {
            packageIdToQuery = clientPackageData.current_package_id;
            console.log("[useSubmissions] Found current_package_id from client:", packageIdToQuery);
          }
        } catch (e) {
          console.error("[useSubmissions] Exception fetching current_package_id:", e);
        }
      }

      if (!packageIdToQuery) {
        console.warn("[useSubmissions] No package ID found to query package details for client:", effectiveClientId);
        return {
          packageName: 'לא משויך לחבילה',
          totalSubmissions: null,
          startDate: null,
          endDate: null,
          isActive: false,
        };
      }

      console.log("[useSubmissions] Querying client_packages with package_id:", packageIdToQuery, "for client:", effectiveClientId);
      const { data: clientPackageData, error: clientPackageError } = await supabase
        .from('client_packages')
        .select(`
          package_id,
          start_date,
          end_date,
          is_active,
          total_dishes,
          service_packages (package_name)
        `)
        .eq('client_id', effectiveClientId)
        .eq('package_id', packageIdToQuery) 
        .single();

      if (clientPackageError) {
        console.error('[useSubmissions] Error fetching client package details:', clientPackageError);
        // If specific client_package link not found, it could be an old package_id or a general one
        // Try fetching from the 'packages' table directly if it's a general package ID
        console.log("[useSubmissions] Trying to fetch general package details for package_id:", packageIdToQuery);
        const { data: generalPackageData, error: generalPackageError } = await supabase
            .from('service_packages')
            .select('package_name, total_servings')
            .eq('package_id', packageIdToQuery)
            .single();
        
        if (generalPackageError) {
            console.error('[useSubmissions] Error fetching general package details:', generalPackageError);
            return {
                packageName: 'שגיאה בטעינת חבילה',
                totalSubmissions: null,
                startDate: null,
                endDate: null,
                isActive: false,
            };
        }
        if (generalPackageData) {
            console.log("[useSubmissions] Fetched general package details:", generalPackageData);
            return {
                packageName: generalPackageData.package_name,
                totalSubmissions: generalPackageData.total_servings,
                startDate: null, // General packages don't have client-specific dates
                endDate: null,
                isActive: true, // Assume active if fetched this way, or add more logic
            };
        }
        return null; // Should not happen if generalPackageData is null and no error
      }

      if (clientPackageData) {
        console.log("[useSubmissions] Fetched client-specific package details:", clientPackageData);
        // Correctly access package name if 'service_packages' is an array or object
        let packageNameFromData: string | null = 'שם חבילה לא ידוע';
        const sp = clientPackageData.service_packages; // Alias for brevity

        if (Array.isArray(sp) && sp.length > 0 && sp[0].package_name) {
          packageNameFromData = sp[0].package_name;
        } else if (sp && typeof sp === 'object' && 'package_name' in sp && (sp as { package_name: string }).package_name) {
          // Fallback if it's a single object (Supabase usually returns array for relations)
          packageNameFromData = (sp as { package_name: string }).package_name;
        }

        return {
          packageName: packageNameFromData,
          totalSubmissions: clientPackageData.total_dishes,
          startDate: clientPackageData.start_date,
          endDate: clientPackageData.end_date,
          isActive: clientPackageData.is_active,
        };
      }
      return null;
    },
    enabled: queryEnabled && !!effectiveClientId,
  });
  
  const totalAllowedSubmissions = packageDetails?.totalSubmissions;
  const submissionsLength = processedItems?.length || 0;
  const remainingServings = (totalAllowedSubmissions !== null && totalAllowedSubmissions !== undefined) 
    ? Math.max(0, totalAllowedSubmissions - submissionsLength)
    : undefined;

  const refreshSubmissions = () => {
    console.log("[useSubmissions] Refreshing submissions for clientId:", effectiveClientId);
    queryClient.invalidateQueries({ queryKey: ["client-processed-items", effectiveClientId] });
    queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] });
  };

  console.log("[useSubmissions] Hook returning:", {
    submissions: processedItems || [],
    submissionsLength,
    remainingServings,
    totalAllowedSubmissions,
    packageDetails,
    loading: loading || (queryEnabled && packageDetailsLoading),
    clientLoading: unifiedLoading,
    error,
    refreshSubmissions,
    clientId: effectiveClientId,
    isAuthenticated: unifiedIsAuthenticated,
    timestamp: Date.now()
  });

  return {
    submissions: processedItems || [],
    submissionsLength,
    remainingServings,
    totalAllowedSubmissions,
    packageDetails,
    loading: loading || (queryEnabled && packageDetailsLoading),
    clientLoading: unifiedLoading,
    error,
    refreshSubmissions,
    refreshPackageDetails: () => queryClient.invalidateQueries({ queryKey: ['clientPackageDetails', effectiveClientId] }),
    clientId: effectiveClientId,
    isAuthenticated: unifiedIsAuthenticated,
  };
}

// Fetch single submission with enhanced details
export const useSubmission = (submissionId: string) => {
  return useQuery<EnhancedSubmission>({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) throw error;
      return data as EnhancedSubmission;
    },
    enabled: !!submissionId,
  });
};

// Fetch submission comments
export const useSubmissionComments = (submissionId: string) => {
  return useQuery<SubmissionComment[]>({
    queryKey: ['submission-comments', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submission_comments')
        .select(`
          *,
          created_by_user:created_by(email)
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SubmissionComment[];
    },
    enabled: !!submissionId,
  });
};

// Update submission status
export const useUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: SubmissionStatusKey }) => {
      const { error } = await supabase
        .from('customer_submissions')
        .update({ submission_status: status })
        .eq('submission_id', submissionId);

      if (error) throw error;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast.success('סטטוס עודכן בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון סטטוס: ${error.message}`);
    }
  });
};

// Update LoRA fields
export const useUpdateSubmissionLora = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      submissionId, 
      loraData 
    }: { 
      submissionId: string; 
      loraData: { 
        lora_link?: string; 
        lora_name?: string; 
        fixed_prompt?: string; 
      } 
    }) => {
      const { error } = await supabase
        .from('customer_submissions')
        .update(loraData)
        .eq('submission_id', submissionId);

      if (error) throw error;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      toast.success('נתוני LoRA עודכנו בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון נתוני LoRA: ${error.message}`);
    }
  });
};

// Add submission comment
export const useAddSubmissionComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      commentType,
      commentText,
      visibility
    }: {
      submissionId: string;
      commentType: SubmissionCommentType;
      commentText: string;
      visibility: string;
    }) => {
      const { error } = await supabase
        .from('submission_comments')
        .insert({
          submission_id: submissionId,
          comment_type: commentType,
          comment_text: commentText,
          visibility
        });

      if (error) throw error;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      toast.success('הערה נוספה בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בהוספת הערה: ${error.message}`);
    }
  });
};

// Update submission images
export const useUpdateSubmissionImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      processedImageUrls,
      mainImageUrl
    }: {
      submissionId: string;
      processedImageUrls?: string[];
      mainImageUrl?: string;
    }) => {
      const updateData: any = {};
      if (processedImageUrls) updateData.processed_image_urls = processedImageUrls;
      if (mainImageUrl) updateData.main_processed_image_url = mainImageUrl;

      const { error } = await supabase
        .from('customer_submissions')
        .update(updateData)
        .eq('submission_id', submissionId);

      if (error) throw error;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      toast.success('תמונות עודכנו בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון תמונות: ${error.message}`);
    }
  });
};

// Delete submission comment
export const useDeleteSubmissionComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, submissionId }: { commentId: string; submissionId: string }) => {
      const { error } = await supabase
        .from('submission_comments')
        .delete()
        .eq('comment_id', commentId);

      if (error) throw error;
      return submissionId;
    },
    onSuccess: (submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      toast.success('הערה נמחקה בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה במחיקת הערה: ${error.message}`);
    }
  });
};

// Get submissions for a specific lead (for lead panel integration)
export const useLeadSubmissions = (leadId: string) => {
  return useQuery({
    queryKey: ['submissions', leadId],
    queryFn: async () => {
      // Direct query: get submissions linked to this lead
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone)
        `)
        .eq('lead_id', leadId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EnhancedSubmission[];
    },
    enabled: !!leadId
  });
};

// Advanced submission search and filtering
export const useSubmissionsWithFilters = (filters: {
  status?: SubmissionStatusKey;
  clientId?: string;
  editorId?: string;
  dateFrom?: string;
  dateTo?: string;
  itemType?: 'dish' | 'cocktail' | 'drink';
}) => {
  return useQuery<EnhancedSubmission[]>({
    queryKey: ['submissions-filtered', filters],
    queryFn: async () => {
      let query = supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('submission_status', filters.status);
      }
      if (filters.clientId) {
        query = query.eq('client_id', filters.clientId);
      }
      if (filters.editorId) {
        query = query.eq('assigned_editor_id', filters.editorId);
      }
      if (filters.itemType) {
        query = query.eq('item_type', filters.itemType);
      }
      if (filters.dateFrom) {
        query = query.gte('uploaded_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('uploaded_at', filters.dateTo);
      }

      query = query.order('uploaded_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data as EnhancedSubmission[];
    },
  });
};

// New hook to link submission to lead
export const useLinkSubmissionToLead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ submissionId, leadId }: { submissionId: string; leadId: string }) => {
      // Use the new manual linking function
      const { data, error } = await supabase.rpc('manually_link_submission_to_lead', {
        p_submission_id: submissionId,
        p_lead_id: leadId
      });

      if (error) throw error;

      return { submissionId, leadId };
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submissions', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activity', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
      toast.success('ההגשה קושרה לליד בהצלחה');
    },
    onError: (error) => {
      console.error('Error linking submission to lead:', error);
      toast.error('שגיאה בקישור ההגשה לליד');
    }
  });
};

// Hook to automatically enable free sample package for leads with submissions
export const useActivateFreeSamplePackage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (leadId: string) => {
      // Check if lead already has free sample package active
      const { data: lead } = await supabase
        .from('leads')
        .select('free_sample_package_active')
        .eq('lead_id', leadId)
        .single();

      if (lead?.free_sample_package_active) {
        return { leadId, alreadyActive: true };
      }

      // Activate free sample package
      const { error } = await supabase
        .from('leads')
        .update({ 
          free_sample_package_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', leadId);

      if (error) throw error;

      // Log activity
      await leadsAPI.addLeadActivityLog(
        leadId,
        'חבילת טעימות הופעלה',
        'חבילת טעימות הופעלה אוטומטית בעקבות הגשה חדשה'
      );

      return { leadId, activated: true };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activity', data.leadId] });
      if (data.activated) {
        toast.success('חבילת טעימות הופעלה אוטומטית');
      }
    }
  });
};

// Hook to get submissions that are not linked to any lead or client
export const useUnlinkedSubmissions = () => {
  return useQuery<EnhancedSubmission[]>({
    queryKey: ['unlinked-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone)
        `)
        .is('lead_id', null)
        .is('client_id', null)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as EnhancedSubmission[];
    },
  });
};

// Hook to search submissions by ID for manual linking
export const useSearchSubmissionById = (submissionId: string) => {
  return useQuery<EnhancedSubmission | null>({
    queryKey: ['submission-search', submissionId],
    queryFn: async () => {
      if (!submissionId || submissionId.length < 8) return null;

      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as EnhancedSubmission;
    },
    enabled: !!submissionId && submissionId.length >= 8,
    retry: false
  });
};
