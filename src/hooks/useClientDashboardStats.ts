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

      // Fetch submissions with detailed error logging
      const { data: submissions, error } = await supabase
        .from("customer_submissions")
        .select(`
          submission_status,
          uploaded_at,
          submission_id,
          item_name_at_submission
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
      console.log('[useClientDashboardStats] Total submissions found:', submissions?.length || 0);

      return countsArray;
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });

  return {
    statusCounts,
    loading,
    error
  };
}
