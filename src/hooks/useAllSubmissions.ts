
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

export function useAllSubmissions() {
  const queryClient = useQueryClient();

  const {
    data: submissions = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ["all-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name)
        `)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching all submissions:", error);
        throw error;
      }

      return data as Submission[];
    }
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["all-submissions"] });
  };

  return {
    submissions,
    loading,
    error,
    refreshSubmissions
  };
}
