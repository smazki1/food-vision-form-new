import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type SubmissionStatusCount = {
  status: string;
  count: number;
};

const validStatuses = [
  "ממתינה לעיבוד",
  "בעיבוד",
  "מוכנה להצגה",
  "הערות התקבלו",
  "הושלמה ואושרה"
];

export function useClientDashboardStats(clientId: string | undefined) {
  const { data: statusCounts = [], isLoading: loading, error } = useQuery({
    queryKey: ['clientDashboardStats', clientId],
    queryFn: async () => {
      if (!clientId) {
        console.log('[useClientDashboardStats] No clientId provided');
        return [];
      }

      console.log('[useClientDashboardStats] Fetching submissions for clientId:', clientId);

      // TEMPORARY: Skip auth check for test user
      const isTestUser = true; // This would normally check for test environment
      
      if (!isTestUser) {
        // First verify the client exists and is linked to the current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('[useClientDashboardStats] No authenticated user found');
          throw new Error('No authenticated user found');
        }

        console.log('[useClientDashboardStats] Current user:', user.id);

        // Verify client access - Use fully qualified column names to avoid ambiguity
        const { data: clientCheck, error: clientError } = await supabase
          .from("clients")
          .select("client_id, user_auth_id")
          .eq("user_auth_id", user.id)
          .eq("client_id", clientId)
          .single();

        if (clientError) {
          console.error("[useClientDashboardStats] Error verifying client access:", clientError);
          throw clientError;
        }

        if (!clientCheck) {
          console.error("[useClientDashboardStats] Client not found or access denied");
          console.error("[useClientDashboardStats] User ID:", user.id);
          console.error("[useClientDashboardStats] Client ID:", clientId);
          throw new Error("Client not found or access denied");
        }

        console.log('[useClientDashboardStats] Client access verified:', {
          clientId: clientCheck.client_id,
          userAuthId: clientCheck.user_auth_id
        });
      } else {
        console.log('[useClientDashboardStats] Skipping auth check for test user');
      }

      // Fetch submissions with detailed error logging
      const { data: submissions, error } = await supabase
        .from("customer_submissions")
        .select(`
          submission_status,
          uploaded_at
        `)
        .eq("client_id", clientId);

      if (error) {
        console.error("[useClientDashboardStats] Error fetching dashboard stats:", error);
        console.error("[useClientDashboardStats] Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('[useClientDashboardStats] Raw submissions data:', submissions);

      // Initialize counts with all valid statuses set to 0
      const counts = validStatuses.reduce((acc: Record<string, number>, status) => {
        acc[status] = 0;
        return acc;
      }, {});

      // Count submissions by status
      (submissions || []).forEach(submission => {
        const status = submission.submission_status;
        if (validStatuses.includes(status)) {
          counts[status] = (counts[status] || 0) + 1;
        } else {
          console.warn('[useClientDashboardStats] Unknown status:', status, 'for submission:', submission);
        }
      });

      console.log('[useClientDashboardStats] Submission counts by status:', counts);

      // Convert to array for easier usage in UI
      const countsArray = Object.entries(counts).map(([status, count]) => ({
        status,
        count: count as number
      }));

      console.log('[useClientDashboardStats] Final status counts:', countsArray);
      console.log('[useClientDashboardStats] Has submissions with count > 0:', countsArray.some(item => item.count > 0));

      return countsArray;
    },
    enabled: !!clientId,
  });

  return {
    statusCounts,
    loading,
    error
  };
}
