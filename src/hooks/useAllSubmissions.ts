
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

export function useAllSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAllSubmissions() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("customer_submissions")
          .select(`
            *,
            clients(restaurant_name)
          `)
          .order("uploaded_at", { ascending: false });

        if (error) throw error;

        setSubmissions(data as Submission[]);
        setError(null);
      } catch (err) {
        console.error("Error fetching all submissions:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch submissions data"));
      } finally {
        setLoading(false);
      }
    }

    fetchAllSubmissions();
  }, []);

  const refreshSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name)
        `)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data as Submission[]);
      setError(null);
    } catch (err) {
      console.error("Error refreshing submissions:", err);
      setError(err instanceof Error ? err : new Error("Failed to refresh submissions data"));
    } finally {
      setLoading(false);
    }
  };

  return {
    submissions,
    loading,
    error,
    refreshSubmissions
  };
}
