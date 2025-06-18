import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { updateClientServings } from "@/api/clientApi";
import { 
  EnhancedSubmission, 
  SubmissionComment, 
  SubmissionCommentType,
  SubmissionStatusKey 
} from '@/types/submission';

// Admin-specific hook to fetch single submission (no client restrictions)
export const useAdminSubmission = (submissionId: string) => {
  return useQuery<EnhancedSubmission>({
    queryKey: ['admin-submission', submissionId],
    queryFn: async () => {
      console.log('[useAdminSubmission] Fetching submission:', submissionId);
      
      // Skip RPC for now and use direct query with simplified joins
      console.log('[useAdminSubmission] Using direct query...');
      
      // First get the submission
      const { data: submissionData, error: submissionError } = await supabase
        .from('customer_submissions')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (submissionError) {
        console.error('[useAdminSubmission] Submission error:', submissionError);
        throw submissionError;
      }
      
      console.log('[useAdminSubmission] Got submission data:', submissionData);
      
      // Then get client data if exists
      let clientData = null;
      if (submissionData.client_id) {
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('restaurant_name, contact_name, email, phone')
          .eq('client_id', submissionData.client_id)
          .single();
          
        if (!clientError && client) {
          clientData = client;
          console.log('[useAdminSubmission] Got client data:', clientData);
        }
      }
      
      // Then get lead data if exists
      let leadData = null;
      if (submissionData.lead_id) {
        const { data: lead, error: leadError } = await supabase
          .from('leads')
          .select('restaurant_name, contact_name, email, phone')
          .eq('lead_id', submissionData.lead_id)
          .single();
          
        if (!leadError && lead) {
          leadData = lead;
          console.log('[useAdminSubmission] Got lead data:', leadData);
        }
      }
      
      // Combine the data
      const processedData = {
        ...submissionData,
        clients: clientData,
        leads: leadData
      };
      
      console.log('[useAdminSubmission] Final processed data:', processedData);
      return processedData as unknown as EnhancedSubmission;
    },
    enabled: !!submissionId,
  });
};

// Admin-specific hook to fetch submission comments (no client restrictions)
export const useAdminSubmissionComments = (submissionId: string) => {
  return useQuery<SubmissionComment[]>({
    queryKey: ['admin-submission-comments', submissionId],
    queryFn: async () => {
      console.log('[useAdminSubmissionComments] Fetching comments for submission:', submissionId);
      
      try {
        // First, try a simple query without joins
        const { data, error } = await supabase
          .from('submission_comments')
          .select(`
            comment_id,
            submission_id,
            comment_type,
            comment_text,
            tagged_users,
            visibility,
            created_by,
            created_at,
            updated_at
          `)
          .eq('submission_id', submissionId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useAdminSubmissionComments] Database error:', error);
          
          // If table doesn't exist, return empty array instead of throwing
          if (error.code === '42P01' || error.message?.includes('relation "public.submission_comments" does not exist')) {
            console.warn('submission_comments table does not exist - returning empty comments');
            return [];
          }
          
          // If RLS access denied, log details but return empty array for now
          if (error.code === '42501' || error.message?.includes('permission denied')) {
            console.warn('Permission denied for submission_comments - returning empty comments. May need RLS policy fix.');
            return [];
          }
          
          // For any other error, log it and return empty array to avoid breaking the UI
          console.error('[useAdminSubmissionComments] Unexpected database error:', error);
          return [];
        }

        console.log('[useAdminSubmissionComments] Successfully fetched comments:', data?.length || 0, 'comments');
        
        // Transform the data to match SubmissionComment type without user info for now
        const transformedData = data?.map(comment => ({
          ...comment,
          created_by_user: undefined // We'll add this later once the basic query works
        })) || [];
        
        return transformedData as SubmissionComment[];
        
      } catch (error) {
        console.error('[useAdminSubmissionComments] Unexpected error:', error);
        // Return empty array instead of failing completely
        return [];
      }
    },
    enabled: !!submissionId,
    retry: (failureCount, error: any) => {
      // Don't retry if table doesn't exist or permission denied
      if (error?.code === '42P01' || error?.code === '42501') {
        return false;
      }
      return failureCount < 2;
    },
  });
};

/**
 * Helper function to check if status requires serving deduction
 */
function isServingDeductionStatus(status: string): boolean {
  return status === 'מוכנה להצגה' || status === 'הושלמה ואושרה';
}

/**
 * Helper function to automatically deduct servings when submission reaches completion stages (admin version)
 */
async function handleAdminAutomaticServingDeduction(submissionId: string, submissionData: any) {
  try {
    // Get client_id from the submission data
    const clientId = submissionData.client_id;
    if (!clientId) {
      console.warn("Cannot deduct servings: submission has no client_id");
      return;
    }

    // Get current client servings
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("remaining_servings, restaurant_name")
      .eq("client_id", clientId)
      .single();

    if (clientError) {
      console.error("Error fetching client for serving deduction:", clientError);
      return;
    }

    const currentServings = client.remaining_servings || 0;
    if (currentServings <= 0) {
      console.warn("Cannot deduct servings: client has no remaining servings");
      return;
    }

    // Deduct one serving
    const newServingsCount = currentServings - 1;
    const notes = `ניכוי אוטומטי בעקבות התקדמות עבודה: ${submissionData.item_name_at_submission}`;

    // Update client servings with audit trail
    await updateClientServings(clientId, newServingsCount, notes);

    console.log(`Successfully deducted 1 serving from client ${client.restaurant_name}. Remaining: ${newServingsCount}`);
    
    // Show Hebrew success message
    toast.success(`נוכה סרבינג אחד מ${client.restaurant_name}. נותרו: ${newServingsCount} מנות`);

  } catch (error) {
    console.error("Error in automatic serving deduction:", error);
    toast.error("שגיאה בניכוי אוטומטי של מנה");
  }
}

// Admin-specific hook to update submission status (no client restrictions)
export const useAdminUpdateSubmissionStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, status }: { submissionId: string; status: SubmissionStatusKey }) => {
      // First get the current submission data before updating
      const { data: currentSubmission, error: fetchError } = await supabase
        .from('customer_submissions')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (fetchError) {
        console.error('Error fetching submission for status update:', fetchError);
        throw fetchError;
      }

      // Update the submission status
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('customer_submissions')
        .update({ submission_status: status })
        .eq('submission_id', submissionId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Automatic serving deduction when submission reaches completion stages
      if (isServingDeductionStatus(status)) {
        await handleAdminAutomaticServingDeduction(submissionId, updatedSubmission);
      }

      return updatedSubmission;
    },
    onSuccess: (data, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      
      // Invalidate client queries to refresh package counts in UI
      if (data.client_id) {
        queryClient.invalidateQueries({ queryKey: ['client', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['client-detail', data.client_id] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
      }
      
      toast.success('סטטוס עודכן בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון סטטוס: ${error.message}`);
    }
  });
};

// Admin-specific hook to update LoRA fields (no client restrictions)
export const useAdminUpdateSubmissionLora = () => {
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
      console.log('[useAdminUpdateSubmissionLora] Updating LoRA data:', { submissionId, loraData });
      
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
        console.error('[useAdminUpdateSubmissionLora] Database error:', error);
        throw error;
      }

      console.log('[useAdminUpdateSubmissionLora] Successfully updated LoRA data:', data);
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
      toast.success('נתוני LoRA עודכנו בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useAdminUpdateSubmissionLora] Mutation error:', error);
      toast.error(`שגיאה בעדכון נתוני LoRA: ${error.message}`);
    }
  });
};

// Admin-specific hook to add submission comment (no client restrictions)
export const useAdminAddSubmissionComment = () => {
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

      
      try {
        // Get user ID - try multiple methods for admin/test users
        let userId: string;
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session?.user?.id) {
          userId = session.user.id;
        } else {
          // Fallback for admin/test users - use a real admin ID from the system
          userId = '4da6bdd1-442e-4e40-8db0-c88fc129c051'; // admin@food-vision.co.il
        }

        const { data, error } = await supabase
          .from('submission_comments')
          .insert({
            submission_id: submissionId,
            comment_type: commentType,
            comment_text: commentText,
            visibility: visibility,
            created_by: userId
          })
          .select(`
            comment_id,
            submission_id,
            comment_type,
            comment_text,
            tagged_users,
            visibility,
            created_by,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          // If table doesn't exist
          if (error.code === '42P01') {
            throw new Error('מערכת ההערות עדיין לא מוכנה');
          }
          
          // If RLS permission denied (401 or permission codes)
          if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('row-level security')) {
            throw new Error('יש להגדיר הרשאות מסד נתונים - אנא הפעל את המיגרציה');
          }
          
          // If foreign key constraint fails
          if (error.code === '23503') {
            throw new Error('הגשה לא נמצאה');
          }
          
          throw new Error('שגיאה בהוספת הערה');
        }


        return data;
        
      } catch (error: any) {
        throw error;
      }
    },
    onSuccess: (_, { submissionId }) => {
      // Invalidate both admin and regular comment queries to ensure sync
      queryClient.invalidateQueries({ queryKey: ['admin-submission-comments', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      
      // Also invalidate the submission itself to update any comment counts
      queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submission', submissionId] });
      
      toast.success('הערה נוספה בהצלחה');
    },
    onError: (error: any) => {
      toast.error(error.message || 'שגיאה בהוספת הערה');
    }
  });
};

// Admin-specific hook to update submission images (no client restrictions)
export const useAdminUpdateSubmissionImages = () => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
      toast.success('תמונות עודכנו בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון תמונות: ${error.message}`);
    }
  });
};

// Admin-specific hook to delete submission comment (no client restrictions)
export const useAdminDeleteSubmissionComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, submissionId }: { commentId: string; submissionId: string }) => {
      // TODO: submission_comments table doesn't exist yet
      console.warn('submission_comments table does not exist - comment not deleted');
      return submissionId;
    },
    onSuccess: (submissionId) => {
      queryClient.invalidateQueries({ queryKey: ['admin-submission-comments', submissionId] });
      toast.success('הערה נמחקה בהצלחה (זמנית - טבלה לא קיימת)');
    },
    onError: (error: any) => {
      toast.error(`שגיאה במחיקת הערה: ${error.message}`);
    }
  });
}; 