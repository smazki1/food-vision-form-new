import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "./useClientAuth";
import { useUnifiedAuth } from "./useUnifiedAuth";
import { useCurrentUserRole } from "./useCurrentUserRole";
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
  const { role } = useCurrentUserRole();
  
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
    userRole: role,
    timestamp: Date.now()
  });

  // Admin/Editor users should not use this customer-specific hook
  if (role === 'admin' || role === 'editor') {
    console.error("[useSubmissions] CRITICAL: Admin/Editor users should not use useSubmissions hook. Use useAllSubmissions, useSubmissionsWithFilters, or other admin-specific hooks instead.");
    
    return {
      submissions: [],
      submissionsLength: 0,
      remainingServings: undefined,
      totalAllowedSubmissions: undefined,
      packageDetails: null,
      loading: false,
      clientLoading: false,
      error: new Error("Admin/Editor users cannot access customer submissions through this hook. Please use admin-specific submission hooks."),
      refreshSubmissions: () => {},
      refreshPackageDetails: () => {},
      clientId: null,
      isAuthenticated: false,
    };
  }

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
            item_type,
            item_name_at_submission,
            submission_status,
            uploaded_at,
            original_image_urls,
            processed_image_urls,
            main_processed_image_url,
            edit_history,
            created_at
          `)
          .eq("client_id", effectiveClientId)
          .order("uploaded_at", { ascending: false });
          
        if (queryError) {
          console.error("[useSubmissions] Error fetching processed items:", queryError);
          throw new Error(`Failed to fetch submissions: ${queryError.message}`);
        }
        
        // Transform data to match expected interface with default values for missing fields
        const submissions = (data || []).map((item: any) => ({
          submission_id: item.submission_id,
          client_id: item.client_id,
          original_item_id: '', // Default empty
          item_type: item.item_type,
          item_name_at_submission: item.item_name_at_submission,
          assigned_package_id_at_submission: undefined,
          submission_status: item.submission_status,
          uploaded_at: item.uploaded_at,
          original_image_urls: item.original_image_urls,
          processed_image_urls: item.processed_image_urls,
          main_processed_image_url: item.main_processed_image_url,
          edit_history: item.edit_history,
          edit_count: 0,
          final_approval_timestamp: null,
          internal_team_notes: null,
          assigned_editor_id: null,
          target_completion_date: null,
          priority: null,
          created_lead_id: null,
          lead_id: null,
          created_at: item.created_at,
          submission_contact_name: null,
          submission_contact_email: null,
          submission_contact_phone: null
        })) as ProcessedItem[];
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
      // Use only columns that actually exist in the database
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          client_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          processed_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          final_approval_timestamp,
          assigned_editor_id,
          lead_id,
          original_item_id,
          lora_link,
          lora_name,
          lora_id,
          fixed_prompt,
          created_lead_id
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) throw error;
      
      // Transform data to match expected interface with defaults for missing fields
      const processedData = {
        ...data,
        // Add compatibility fields with defaults
        created_at: data.uploaded_at, // Use uploaded_at as created_at
        edit_count: Array.isArray(data.edit_history) ? data.edit_history.length : 0,
        internal_team_notes: '',
        target_completion_date: null,
        priority: 'Medium',
        submission_contact_name: '',
        submission_contact_email: '',
        submission_contact_phone: '',
        assigned_package_id_at_submission: null,
        // Add missing status timestamp fields
        "status_ממתינה_לעיבוד_at": null,
        "status_בעיבוד_at": null,
        "status_מוכנה_להצגה_at": null,
        "status_הערות_התקבלו_at": null,
        "status_הושלמה_ואושרה_at": null,
        clients: undefined, // Will be fetched separately if needed
        leads: undefined
      };
      
      return processedData as unknown as EnhancedSubmission;
    },
    enabled: !!submissionId,
  });
};

// Fetch submission comments
export const useSubmissionComments = (submissionId: string) => {
  return useQuery<SubmissionComment[]>({
    queryKey: ['submission-comments', submissionId],
    queryFn: async () => {
      console.log('[useSubmissionComments] Fetching comments for submission:', submissionId);
      
      const { data, error } = await supabase
        .from('submission_comments')
        .select(`
          *,
          created_by_user:created_by(email)
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useSubmissionComments] Database error:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') { // relation does not exist
          console.warn('submission_comments table does not exist - returning empty comments');
          return [];
        }
        throw error;
      }

      console.log('[useSubmissionComments] Got comments:', data);
      return data as SubmissionComment[] || [];
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
        lora_id?: string;
      } 
    }) => {
      console.log('[useUpdateSubmissionLora] Updating LoRA data:', { submissionId, loraData });
      
      const { data, error } = await supabase
        .from('customer_submissions')
        .update({
          lora_link: loraData.lora_link,
          lora_name: loraData.lora_name,
          fixed_prompt: loraData.fixed_prompt,
          lora_id: loraData.lora_id
        })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateSubmissionLora] Database error:', error);
        throw error;
      }

      console.log('[useUpdateSubmissionLora] Successfully updated LoRA data:', data);
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      toast.success('נתוני LoRA עודכנו בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useUpdateSubmissionLora] Mutation error:', error);
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
      console.log('[useAddSubmissionComment] Adding comment:', { submissionId, commentType, commentText, visibility });
      
      const { data, error } = await supabase
        .from('submission_comments')
        .insert({
          submission_id: submissionId,
          comment_type: commentType,
          comment_text: commentText,
          visibility: visibility,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('[useAddSubmissionComment] Database error:', error);
        // If table doesn't exist, show warning but don't fail completely
        if (error.code === '42P01') { // relation does not exist
          console.warn('submission_comments table does not exist - comment not saved');
          throw new Error('מערכת ההערות עדיין לא מוכנה - אנא נסה שוב מאוחר יותר');
        }
        throw error;
      }

      console.log('[useAddSubmissionComment] Comment added successfully:', data);
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      toast.success('הערה נוספה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useAddSubmissionComment] Mutation error:', error);
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
      // TODO: submission_comments table doesn't exist yet
      console.warn('submission_comments table does not exist - comment not deleted');
      return submissionId;
    },
    onSuccess: (submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      toast.success('הערה נמחקה בהצלחה (זמנית - טבלה לא קיימת)');
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
      // Use only columns that actually exist in the database
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          client_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          processed_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          final_approval_timestamp,
          assigned_editor_id,
          lead_id,
          original_item_id,
          lora_link,
          lora_name,
          lora_id,
          fixed_prompt,
          created_lead_id
        `)
        .eq('lead_id', leadId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected interface with defaults for missing fields
      const processedData = data?.map(item => ({
        ...item,
        // Add compatibility fields with defaults
        created_at: item.uploaded_at, // Use uploaded_at as created_at
        edit_count: Array.isArray(item.edit_history) ? item.edit_history.length : 0,
        internal_team_notes: '',
        target_completion_date: null,
        priority: 'Medium',
        submission_contact_name: '',
        submission_contact_email: '',
        submission_contact_phone: '',
        assigned_package_id_at_submission: null,
        // Add missing status timestamp fields
        "status_ממתינה_לעיבוד_at": null,
        "status_בעיבוד_at": null,
        "status_מוכנה_להצגה_at": null,
        "status_הערות_התקבלו_at": null,
        "status_הושלמה_ואושרה_at": null,
        clients: undefined, // Will be fetched separately if needed
        leads: undefined
      }));
      
      return (processedData || []) as unknown as EnhancedSubmission[];
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
          created_at,
          "status_ממתינה_לעיבוד_at",
          "status_בעיבוד_at",
          "status_מוכנה_להצגה_at",
          "status_הערות_התקבלו_at",
          "status_הושלמה_ואושרה_at",
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
      
      // Handle joined data that comes as arrays
      const processedData = data?.map(item => ({
        ...item,
        clients: Array.isArray(item.clients) && item.clients.length > 0 ? item.clients[0] : undefined,
        leads: Array.isArray(item.leads) && item.leads.length > 0 ? item.leads[0] : undefined
      }));
      
      return (processedData || []) as EnhancedSubmission[];
    },
  });
};

// New hook to link submission to lead
export const useLinkSubmissionToLead = () => {
  const queryClient = useQueryClient();
  const activatePackageMutation = useActivateFreeSamplePackage();
  
  return useMutation({
    mutationFn: async ({ submissionId, leadId }: { submissionId: string; leadId: string }) => {
      // Use the new manual linking function
      const { data, error } = await supabase.rpc('manually_link_submission_to_lead', {
        p_submission_id: submissionId,
        p_lead_id: leadId
      });

      if (error) throw error;

      // Automatically activate free sample package when linking submission to lead
      try {
        await activatePackageMutation.mutateAsync(leadId);
        console.log('[useLinkSubmissionToLead] Free sample package activated for lead:', leadId);
      } catch (activateError) {
        console.warn('[useLinkSubmissionToLead] Failed to activate free sample package:', activateError);
        // Don't throw error - the main linking succeeded
      }

      return { submissionId, leadId };
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['submissions', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activity', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
      toast.success('ההגשה קושרה לליד בהצלחה וחבילת טעימות הופעלה');
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
      // Use only columns that actually exist in the database
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          client_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          processed_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          final_approval_timestamp,
          assigned_editor_id,
          lead_id,
          original_item_id,
          lora_link,
          lora_name,
          lora_id,
          fixed_prompt,
          created_lead_id
        `)
        .is('lead_id', null)
        .is('client_id', null)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected interface with defaults for missing fields
      const processedData = data?.map(item => ({
        ...item,
        // Add compatibility fields with defaults
        created_at: item.uploaded_at, // Use uploaded_at as created_at
        edit_count: Array.isArray(item.edit_history) ? item.edit_history.length : 0,
        internal_team_notes: '',
        target_completion_date: null,
        priority: 'Medium',
        submission_contact_name: '',
        submission_contact_email: '',
        submission_contact_phone: '',
        assigned_package_id_at_submission: null,
        // Add missing status timestamp fields
        "status_ממתינה_לעיבוד_at": null,
        "status_בעיבוד_at": null,
        "status_מוכנה_להצגה_at": null,
        "status_הערות_התקבלו_at": null,
        "status_הושלמה_ואושרה_at": null,
        clients: undefined, // Will be fetched separately if needed
        leads: undefined
      }));
      
      return (processedData || []) as unknown as EnhancedSubmission[];
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
          created_at,
          "status_ממתינה_לעיבוד_at",
          "status_בעיבוד_at",
          "status_מוכנה_להצגה_at",
          "status_הערות_התקבלו_at",
          "status_הושלמה_ואושרה_at",
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      // Handle joined data that comes as arrays
      const processedData = {
        ...data,
        clients: Array.isArray(data.clients) && data.clients.length > 0 ? data.clients[0] : undefined,
        leads: Array.isArray(data.leads) && data.leads.length > 0 ? data.leads[0] : undefined
      };
      
      return processedData as unknown as EnhancedSubmission;
    },
    enabled: !!submissionId && submissionId.length >= 8,
    retry: false
  });
};
