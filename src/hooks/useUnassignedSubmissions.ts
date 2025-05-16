
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";

export function useUnassignedSubmissions() {
  const queryClient = useQueryClient();

  const {
    data: submissions = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["unassigned-submissions"],
    queryFn: async () => {
      // Fetch submissions that don't have an editor assigned
      // OR have assigned_editor_id but status is "ממתינה להקצאה מחדש"
      const { data, error } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name)
        `)
        .or('assigned_editor_id.is.null,submission_status.eq.ממתינה להקצאה מחדש')
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      return data as Submission[];
    },
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["unassigned-submissions"] });
  };

  return {
    submissions,
    loading,
    error,
    refreshSubmissions,
  };
}
