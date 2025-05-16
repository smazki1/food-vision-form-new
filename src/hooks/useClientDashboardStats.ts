
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

type SubmissionStatusCount = {
  status: string;
  count: number;
};

export function useClientDashboardStats(clientId: string | undefined) {
  const [statusCounts, setStatusCounts] = useState<SubmissionStatusCount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDashboardStats() {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch all submissions for this client
        const { data: submissions, error } = await supabase
          .from("customer_submissions")
          .select("submission_status")
          .eq("client_id", clientId);

        if (error) throw error;
        
        // Count submissions by status
        const counts = submissions.reduce((acc: Record<string, number>, submission) => {
          const status = submission.submission_status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        // Convert to array for easier usage in UI
        const countsArray = Object.entries(counts).map(([status, count]) => ({
          status,
          count: count as number
        }));
        
        setStatusCounts(countsArray);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch dashboard stats"));
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardStats();
  }, [clientId]);

  return {
    statusCounts,
    loading,
    error
  };
}
