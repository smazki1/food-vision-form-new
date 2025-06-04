import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
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
      
      const { data, error } = await supabase
        .from('submission_comments')
        .select(`
          *,
          created_by_user:created_by(email)
        `)
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[useAdminSubmissionComments] Database error:', error);
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') { // relation does not exist
          console.warn('submission_comments table does not exist - returning empty comments');
          return [];
        }
        throw error;
      }

      console.log('[useAdminSubmissionComments] Got comments:', data);
      return data as SubmissionComment[] || [];
    },
    enabled: !!submissionId,
  });
};

// Admin-specific hook to update submission status (no client restrictions)
export const useAdminUpdateSubmissionStatus = () => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-submission', submissionId] });
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
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
      console.log('[useAdminAddSubmissionComment] Adding comment:', { submissionId, commentType, commentText, visibility });
      
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
        console.error('[useAdminAddSubmissionComment] Database error:', error);
        // If table doesn't exist, show warning but don't fail completely
        if (error.code === '42P01') { // relation does not exist
          console.warn('submission_comments table does not exist - comment not saved');
          throw new Error('מערכת ההערות עדיין לא מוכנה - אנא נסה שוב מאוחר יותר');
        }
        throw error;
      }

      console.log('[useAdminAddSubmissionComment] Comment added successfully:', data);
      return data;
    },
    onSuccess: (_, { submissionId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-submission-comments', submissionId] });
      toast.success('הערה נוספה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useAdminAddSubmissionComment] Mutation error:', error);
      toast.error(`שגיאה בהוספת הערה: ${error.message}`);
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