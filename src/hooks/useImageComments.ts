import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ImageComment, ImageCommentType } from '@/types/submission';
import { useToast } from '@/hooks/use-toast';

// Hook to fetch image comments for a specific image
export const useImageComments = (submissionId: string, imageUrl: string) => {
  return useQuery<ImageComment[]>({
    queryKey: ['image-comments', submissionId, imageUrl],
    queryFn: async () => {
      console.log('[useImageComments] Fetching comments for image:', { submissionId, imageUrl });
      
      try {
        const { data, error } = await supabase
          .from('image_comments')
          .select(`
            comment_id,
            submission_id,
            image_url,
            image_type,
            comment_type,
            comment_text,
            tagged_users,
            visibility,
            created_by,
            created_at,
            updated_at
          `)
          .eq('submission_id', submissionId)
          .eq('image_url', imageUrl)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('[useImageComments] Database error:', error);
          
          // If table doesn't exist, return empty array
          if (error.code === '42P01') {
            console.warn('image_comments table does not exist - returning empty comments');
            return [];
          }
          
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('[useImageComments] Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!submissionId && !!imageUrl,
    staleTime: 10_000,
    gcTime: 60_000,
  });
};

// Hook to add a new image comment
export const useAddImageComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      submissionId,
      imageUrl,
      imageType,
      commentType,
      commentText,
      visibility = 'admin'
    }: {
      submissionId: string;
      imageUrl: string;
      imageType: 'original' | 'processed';
      commentType: ImageCommentType;
      commentText: string;
      visibility?: string;
    }) => {
      console.log('[useAddImageComment] Adding comment:', { 
        submissionId, 
        imageUrl, 
        imageType, 
        commentType, 
        commentText, 
        visibility 
      });
      
      const { data, error } = await supabase
        .from('image_comments')
        .insert({
          submission_id: submissionId,
          image_url: imageUrl,
          image_type: imageType,
          comment_type: commentType,
          comment_text: commentText,
          visibility: visibility,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) {
        console.error('[useAddImageComment] Database error:', error);
        
        // If table doesn't exist, show warning
        if (error.code === '42P01') {
          console.warn('image_comments table does not exist - comment not saved');
          throw new Error('מערכת ההערות לתמונות עדיין לא מוכנה - אנא נסה שוב מאוחר יותר');
        }
        throw error;
      }

      console.log('[useAddImageComment] Comment added successfully:', data);
      return data;
    },
    onSuccess: (_, { submissionId, imageUrl }) => {
      // Invalidate both the specific image comments and all image comments for the submission
      queryClient.invalidateQueries({ queryKey: ['image-comments', submissionId, imageUrl] });
      queryClient.invalidateQueries({ queryKey: ['image-comments', submissionId] });
      toast.success('הערה לתמונה נוספה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useAddImageComment] Mutation error:', error);
      toast.error(`שגיאה בהוספת הערה לתמונה: ${error.message}`);
    }
  });
};

// Hook to update an image comment
export const useUpdateImageComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      commentId,
      commentText,
      visibility
    }: {
      commentId: string;
      commentText: string;
      visibility?: string;
    }) => {
      const updateData: any = { comment_text: commentText };
      if (visibility) updateData.visibility = visibility;

      const { data, error } = await supabase
        .from('image_comments')
        .update(updateData)
        .eq('comment_id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['image-comments', data.submission_id, data.image_url] });
      toast.success('הערה לתמונה עודכנה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useUpdateImageComment] Error updating comment:', error);
      toast.error(`שגיאה בעדכון הערה לתמונה: ${error.message}`);
    }
  });
};

// Hook to delete an image comment
export const useDeleteImageComment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('image_comments')
        .delete()
        .eq('comment_id', commentId);

      if (error) throw error;
      return commentId;
    },
    onSuccess: (commentId) => {
      // We need to invalidate all image comments queries since we don't know which one
      queryClient.invalidateQueries({ queryKey: ['image-comments'] });
      toast.success('הערה לתמונה נמחקה בהצלחה');
    },
    onError: (error: any) => {
      console.error('[useDeleteImageComment] Error deleting comment:', error);
      toast.error(`שגיאה במחיקת הערה לתמונה: ${error.message}`);
    }
  });
};

// Hook to fetch all image comments for a submission (for admin/editor views)
export const useSubmissionImageComments = (submissionId: string) => {
  return useQuery<ImageComment[]>({
    queryKey: ['image-comments', submissionId],
    queryFn: async () => {
      console.log('[useSubmissionImageComments] Fetching all image comments for submission:', submissionId);
      
      try {
        const { data, error } = await supabase
          .from('image_comments')
          .select(`
            comment_id,
            submission_id,
            image_url,
            image_type,
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
          console.error('[useSubmissionImageComments] Database error:', error);
          
          if (error.code === '42P01') {
            console.warn('image_comments table does not exist - returning empty comments');
            return [];
          }
          
          throw error;
        }

        console.log('[useSubmissionImageComments] Successfully fetched comments:', data?.length || 0, 'comments');
        return data || [];
      } catch (error) {
        console.error('[useSubmissionImageComments] Error fetching comments:', error);
        return [];
      }
    },
    enabled: !!submissionId,
  });
};
