
import { useState, useEffect } from "react";
import { Submission, getClientSubmissions, getClientRemainingServings } from "@/api/submissionApi";

export function useSubmissions(clientId?: string) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [remainingServings, setRemainingServings] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [submissionsData, servingsCount] = await Promise.all([
          getClientSubmissions(clientId),
          getClientRemainingServings(clientId)
        ]);
        
        setSubmissions(submissionsData);
        setRemainingServings(servingsCount);
        setError(null);
      } catch (err) {
        console.error("Error fetching submissions data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch submissions data"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clientId]);

  const refreshSubmissions = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const submissionsData = await getClientSubmissions(clientId);
      setSubmissions(submissionsData);
      
      const servingsCount = await getClientRemainingServings(clientId);
      setRemainingServings(servingsCount);
    } catch (err) {
      console.error("Error refreshing submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    submissions,
    remainingServings,
    loading,
    error,
    refreshSubmissions
  };
}
