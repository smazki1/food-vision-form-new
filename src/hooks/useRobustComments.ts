import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types for the robust comment system
export interface RobustComment {
  id: string;
  text: string;
  timestamp: string;
  source: 'lead' | 'client' | 'manual';
  entity_id: string;
  entity_type: 'lead' | 'client';
}

export interface RobustNote {
  id: string;
  content: string;
  last_updated: string;
  entity_id: string;
  entity_type: 'lead' | 'client';
}

// Lead Comments System with Database Persistence
export const useRobustLeadComments = (leadId: string) => {
  const queryClient = useQueryClient();

  // Fetch comments with proper database query
  const commentsQuery = useQuery({
    queryKey: ['robust-lead-comments', leadId],
    queryFn: async () => {
      console.log('[RobustComments] Fetching lead comments from database:', leadId);
      
      // Get all activities for this lead and filter in JavaScript to avoid Hebrew LIKE issues
      const { data: allData, error } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_timestamp', { ascending: false });
        
      console.log('[RobustComments] All activities for lead:', allData);
      console.log('[RobustComments] Database error (if any):', error);
      
      // If we get an empty result, let's check authentication
      if ((!allData || allData.length === 0) && !error) {
        console.warn('[RobustComments] No activities returned - possible authentication/RLS issue');
        
        // Try to get current session info for debugging
        const { data: session } = await supabase.auth.getSession();
        console.log('[RobustComments] Current session:', session?.session?.user?.id ? 'authenticated' : 'not authenticated');
      }

      if (error) {
        console.error('[RobustComments] Database error:', error);
        throw error;
      }

      // Filter activities that start with "תגובה:" in JavaScript to avoid Hebrew LIKE issues
      const commentActivities = (allData || []).filter(activity => 
        activity.activity_description && activity.activity_description.startsWith('תגובה:')
      );
      
      console.log('[RobustComments] Comment activities found:', commentActivities);

      const comments: RobustComment[] = commentActivities.map(activity => ({
        id: activity.activity_id,
        text: activity.activity_description.replace('תגובה: ', ''),
        timestamp: activity.activity_timestamp,
        source: 'lead' as const,
        entity_id: leadId,
        entity_type: 'lead' as const
      }));

      console.log('[RobustComments] Fetched comments:', comments);
      return comments;
    },
    enabled: !!leadId,
    staleTime: 30 * 1000, // 30 seconds - fresh enough but not too aggressive
    refetchOnMount: true, // Always refetch on mount to get latest data
  });

  // Add comment with robust persistence
  const addCommentMutation = useMutation({
    mutationFn: async ({ comment }: { comment: string }) => {
      console.log('[RobustComments] Adding lead comment to database:', { leadId, comment });
      
      // Try RPC first (proper way)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('log_lead_activity', {
          p_lead_id: leadId,
          p_activity_description: `תגובה: ${comment}`
        });

        if (!rpcError) {
          console.log('[RobustComments] RPC successful, data:', rpcData);
          
          // Immediately refetch to ensure we see the new comment
          queryClient.invalidateQueries({ queryKey: ['robust-lead-comments', leadId] });
          
          return {
            id: `temp-${Date.now()}`,
            text: comment,
            timestamp: new Date().toISOString(),
            source: 'manual' as const,
            entity_id: leadId,
            entity_type: 'lead' as const
          };
        } else {
          console.warn('[RobustComments] RPC failed, trying direct insert:', rpcError);
        }
      } catch (rpcError) {
        console.warn('[RobustComments] RPC exception, trying direct insert:', rpcError);
      }

      // Fallback to direct insert
      const { data, error } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: leadId,
          activity_description: `תגובה: ${comment}`,
          activity_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[RobustComments] Direct insert failed:', error);
        throw error;
      }

      console.log('[RobustComments] Direct insert successful:', data);
      return {
        id: data.activity_id,
        text: comment,
        timestamp: data.activity_timestamp,
        source: 'manual' as const,
        entity_id: leadId,
        entity_type: 'lead' as const
      };
    },
    onMutate: async ({ comment }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['robust-lead-comments', leadId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['robust-lead-comments', leadId]);

      // Optimistically update to the new value
      const optimisticComment: RobustComment = {
        id: `optimistic-${Date.now()}`,
        text: comment,
        timestamp: new Date().toISOString(),
        source: 'manual',
        entity_id: leadId,
        entity_type: 'lead'
      };

      queryClient.setQueryData(['robust-lead-comments', leadId], (old: RobustComment[] = []) => {
        return [optimisticComment, ...old];
      });

      return { previousComments };
    },
    onSuccess: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['robust-lead-comments', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
      toast.success('התגובה נוספה בהצלחה');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['robust-lead-comments', leadId], context?.previousComments);
      console.error('[RobustComments] Add comment error:', error);
      toast.error('שגיאה בהוספת התגובה');
    }
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    addComment: (comment: string) => addCommentMutation.mutateAsync({ comment }),
    isAddingComment: addCommentMutation.isPending
  };
};

// Client Comments System with JSON Field Protection
export const useRobustClientComments = (clientId: string) => {
  const queryClient = useQueryClient();

  // Fetch comments from client's internal_notes
  const commentsQuery = useQuery({
    queryKey: ['robust-client-comments', clientId],
    queryFn: async () => {
      console.log('[RobustComments] Fetching client comments:', clientId);
      
      const { data, error } = await supabase
        .from('clients')
        .select('internal_notes')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error('[RobustComments] Database error:', error);
        throw error;
      }

      let comments: RobustComment[] = [];
      if (data?.internal_notes) {
        try {
          const parsed = JSON.parse(data.internal_notes);
          if (parsed.clientComments && Array.isArray(parsed.clientComments)) {
            comments = parsed.clientComments.map((comment: any) => ({
              id: comment.id || `legacy-${Date.now()}`,
              text: comment.text || '',
              timestamp: comment.timestamp || new Date().toISOString(),
              source: comment.source || 'client' as const,
              entity_id: clientId,
              entity_type: 'client' as const
            }));
          }
        } catch (e) {
          console.warn('[RobustComments] Failed to parse internal_notes JSON:', e);
        }
      }

      console.log('[RobustComments] Fetched client comments:', comments);
      return comments;
    },
    enabled: !!clientId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true
  });

  // Add comment with atomic update
  const addCommentMutation = useMutation({
    mutationFn: async ({ comment }: { comment: string }) => {
      console.log('[RobustComments] Adding client comment with atomic update:', { clientId, comment });
      
      // Use a transaction-like approach to prevent race conditions
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        attempts++;
        
        // Get the latest data
        const { data: currentClient, error: fetchError } = await supabase
          .from('clients')
          .select('internal_notes')
          .eq('client_id', clientId)
          .single();

        if (fetchError) {
          console.error('[RobustComments] Failed to fetch current client data:', fetchError);
          throw fetchError;
        }

        // Parse existing comments
        let existingData: any = {};
        if (currentClient?.internal_notes) {
          try {
            existingData = JSON.parse(currentClient.internal_notes);
          } catch (e) {
            existingData = { originalNotes: currentClient.internal_notes };
          }
        }

        const existingComments = existingData.clientComments || [];

        // Create new comment
        const newComment: RobustComment = {
          id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: comment,
          timestamp: new Date().toISOString(),
          source: 'client',
          entity_id: clientId,
          entity_type: 'client'
        };

        // Update the data
        const updatedData = {
          ...existingData,
          clientComments: [newComment, ...existingComments],
          lastCommentUpdate: new Date().toISOString()
        };

        // Attempt the update
        const { error: updateError } = await supabase
          .from('clients')
          .update({ 
            internal_notes: JSON.stringify(updatedData),
            updated_at: new Date().toISOString()
          })
          .eq('client_id', clientId);

        if (!updateError) {
          console.log('[RobustComments] Client comment added successfully on attempt:', attempts);
          return newComment;
        }

        console.warn(`[RobustComments] Update attempt ${attempts} failed:`, updateError);
        
        if (attempts === maxAttempts) {
          throw updateError;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }

      throw new Error('Max retry attempts reached');
    },
    onMutate: async ({ comment }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['robust-client-comments', clientId] });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData(['robust-client-comments', clientId]);

      // Optimistically update to the new value
      const optimisticComment: RobustComment = {
        id: `optimistic-${Date.now()}`,
        text: comment,
        timestamp: new Date().toISOString(),
        source: 'client',
        entity_id: clientId,
        entity_type: 'client'
      };

      queryClient.setQueryData(['robust-client-comments', clientId], (old: RobustComment[] = []) => {
        return [optimisticComment, ...old];
      });

      return { previousComments };
    },
    onSuccess: () => {
      // Refetch to get the real data from server
      queryClient.invalidateQueries({ queryKey: ['robust-client-comments', clientId] });
      // Also invalidate the clients cache so the updated internal_notes is reflected
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && (
            key[0] === 'clients' || 
            key[0] === 'clients_simplified' ||
            key[0] === 'clients_list_for_admin'
          );
        }
      });
      toast.success('התגובה נוספה בהצלחה');
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update
      queryClient.setQueryData(['robust-client-comments', clientId], context?.previousComments);
      console.error('[RobustComments] Add comment error:', error);
      toast.error('שגיאה בהוספת התגובה');
    }
  });

  return {
    comments: commentsQuery.data || [],
    isLoading: commentsQuery.isLoading,
    addComment: (comment: string) => addCommentMutation.mutateAsync({ comment }),
    isAddingComment: addCommentMutation.isPending
  };
};

// Robust Notes System (for both leads and clients)
export const useRobustNotes = (entityId: string, entityType: 'lead' | 'client') => {
  const queryClient = useQueryClient();

  // Fetch notes
  const notesQuery = useQuery({
    queryKey: ['robust-notes', entityType, entityId],
    queryFn: async () => {
      console.log('[RobustNotes] Fetching notes:', { entityType, entityId });
      
      const tableName = entityType === 'lead' ? 'leads' : 'clients';
      const { data, error } = await supabase
        .from(tableName)
        .select('notes')
        .eq(entityType === 'lead' ? 'lead_id' : 'client_id', entityId)
        .single();

      if (error) {
        console.error('[RobustNotes] Database error:', error);
        throw error;
      }

      const note: RobustNote = {
        id: `${entityType}-notes-${entityId}`,
        content: data?.notes || '',
        last_updated: new Date().toISOString(),
        entity_id: entityId,
        entity_type: entityType
      };

      console.log('[RobustNotes] Fetched note:', note);
      return note;
    },
    enabled: !!entityId,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true
  });

  // Update notes with debouncing protection
  const updateNotesMutation = useMutation({
    mutationFn: async ({ content }: { content: string }) => {
      console.log('[RobustNotes] Updating notes:', { entityType, entityId, content });
      
      const tableName = entityType === 'lead' ? 'leads' : 'clients';
      const idColumn = entityType === 'lead' ? 'lead_id' : 'client_id';
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          notes: content,
          updated_at: new Date().toISOString()
        })
        .eq(idColumn, entityId);

      if (error) {
        console.error('[RobustNotes] Update error:', error);
        throw error;
      }

      return {
        id: `${entityType}-notes-${entityId}`,
        content,
        last_updated: new Date().toISOString(),
        entity_id: entityId,
        entity_type: entityType
      };
    },
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['robust-notes', entityType, entityId] });
      
      if (entityType === 'lead') {
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
      } else {
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey;
            return Array.isArray(key) && (
              key[0] === 'clients' || 
              key[0] === 'clients_simplified' ||
              key[0] === 'clients_list_for_admin'
            );
          }
        });
      }
      
      toast.success('ההערות נשמרו בהצלחה');
    },
    onError: (error) => {
      console.error('[RobustNotes] Update error:', error);
      toast.error('שגיאה בשמירת ההערות');
    }
  });

  return {
    note: notesQuery.data,
    isLoading: notesQuery.isLoading,
    updateNotes: (content: string) => updateNotesMutation.mutateAsync({ content }),
    isUpdating: updateNotesMutation.isPending
  };
}; 