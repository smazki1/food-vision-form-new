
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

/**
 * Hook for fetching submission data
 */
export function useSubmissionData(submissionId?: string) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchSubmission() {
      if (!submissionId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("customer_submissions")
          .select(`
            *,
            clients(restaurant_name)
          `)
          .eq("submission_id", submissionId)
          .single();

        if (error) throw error;
        setSubmission(data as Submission);
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch submission"));
      } finally {
        setLoading(false);
      }
    }

    fetchSubmission();
  }, [submissionId]);

  return {
    submission,
    setSubmission,
    loading,
    error
  };
}
