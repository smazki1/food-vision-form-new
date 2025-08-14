import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedSubmission } from '@/types/submission';

export const useClientSubmissions = (clientId: string) => {
  return useQuery<EnhancedSubmission[]>({
    queryKey: ['client-submissions', clientId],
    queryFn: async () => {
      console.log('[useClientSubmissions] Fetching submissions for client:', clientId);
      
      // Try admin RPC first (handles RLS, checks is_admin() server-side)
      try {
        const { data: rpcData, error: rpcError }: any = await supabase
          .rpc('admin_get_client_submissions' as any, { p_client_id: clientId });
        if (!rpcError && Array.isArray(rpcData)) {
          console.log('[useClientSubmissions] Using admin_get_client_submissions RPC, rows:', rpcData.length);
          // Fetch client context for display
          const { data: clientInfo } = await supabase
            .from('clients')
            .select('restaurant_name, contact_name, email, phone')
            .eq('client_id', clientId)
            .single();
          const clientData = clientInfo ? {
            restaurant_name: clientInfo.restaurant_name,
            contact_name: clientInfo.contact_name,
            email: clientInfo.email,
            phone: clientInfo.phone
          } : null;
          return (rpcData as any[]).map((s) => ({ ...s, clients: clientData, leads: null })) as EnhancedSubmission[];
        }
      } catch (e) {
        console.warn('[useClientSubmissions] RPC not available or failed, falling back to direct query');
      }

      // Get client data to find original lead ID if exists
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from('clients')
        .select('original_lead_id, restaurant_name, contact_name, email, phone')
        .eq('client_id', clientId)
        .single();

      if (clientInfoError) {
        console.error('[useClientSubmissions] Error fetching client data:', clientInfoError);
        throw clientInfoError;
      }

      // Build query to get submissions - include both client_id and original lead submissions
      let query = supabase
        .from('customer_submissions')
        .select('*');

      if (clientInfo?.original_lead_id) {
        // Query submissions that are either directly linked to client OR linked to the original lead
        query = query.or(`client_id.eq.${clientId},lead_id.eq.${clientInfo.original_lead_id},created_lead_id.eq.${clientInfo.original_lead_id}`);
        console.log('[useClientSubmissions] Querying submissions for client and original lead:', clientInfo.original_lead_id);
      } else {
        // If no original lead, just query by client_id
        query = query.eq('client_id', clientId);
        console.log('[useClientSubmissions] Querying submissions for client only');
      }

      const { data: submissionsData, error: submissionsError } = await query
        .order('uploaded_at', { ascending: false });

      if (submissionsError) {
        console.error('[useClientSubmissions] Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      if (!submissionsData || submissionsData.length === 0) {
        console.log('[useClientSubmissions] No submissions found for client:', clientId);
        return [];
      }

      console.log('[useClientSubmissions] Found submissions:', submissionsData.length);

      // Use client data for context (already fetched above)
      const clientData = clientInfo ? {
        restaurant_name: clientInfo.restaurant_name,
        contact_name: clientInfo.contact_name,
        email: clientInfo.email,
        phone: clientInfo.phone
      } : null;

      // Transform the data to match EnhancedSubmission format
      const enhancedSubmissions = submissionsData.map(submission => ({
        ...submission,
        clients: clientData,
        leads: null // Client submissions don't have lead data
      }));

      console.log('[useClientSubmissions] Returning enhanced submissions:', enhancedSubmissions.length);
      return enhancedSubmissions as EnhancedSubmission[];
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  });
};

// Hook for getting submission stats for a client
export const useClientSubmissionStats = (clientId: string) => {
  return useQuery({
    queryKey: ['client-submission-stats', clientId],
    queryFn: async () => {
      console.log('[useClientSubmissionStats] Fetching stats for client:', clientId);
      
      // Get client data to find original lead ID if exists
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from('clients')
        .select('original_lead_id')
        .eq('client_id', clientId)
        .single();

      if (clientInfoError) {
        console.error('[useClientSubmissionStats] Error fetching client data:', clientInfoError);
        throw clientInfoError;
      }

      // Build query to get submission stats - include both client_id and original lead submissions
      let query = supabase
        .from('customer_submissions')
        .select('submission_status, item_type');

      if (clientInfo?.original_lead_id) {
        // Query submissions that are either directly linked to client OR linked to the original lead
        query = query.or(`client_id.eq.${clientId},lead_id.eq.${clientInfo.original_lead_id},created_lead_id.eq.${clientInfo.original_lead_id}`);
      } else {
        // If no original lead, just query by client_id
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useClientSubmissionStats] Error fetching stats:', error);
        throw error;
      }

      // Calculate stats
      const stats = {
        total: data.length,
        byStatus: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        processed: 0,
        pending: 0
      };

      data.forEach(submission => {
        // Count by status
        const status = submission.submission_status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        
        // Count by type
        const type = submission.item_type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;
        
        // Count processed vs pending - include מוכנה להצגה as processed since servings are deducted
        if (status === 'הושלמה ואושרה' || status === 'מוכנה להצגה' || status === 'הושלם' || status === 'מאושר') {
          stats.processed++;
        } else if (status === 'בעיבוד' || status === 'ממתינה לעיבוד' || status === 'ממתין לעיבוד') {
          stats.pending++;
        }
      });

      console.log('[useClientSubmissionStats] Calculated stats:', stats);
      return stats;
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
  });
}; 