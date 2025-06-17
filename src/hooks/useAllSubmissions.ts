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
          submission_id,
          client_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          processed_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          final_approval_timestamp,
          assigned_editor_id,
          lead_id,
          original_item_id,
          lora_link,
          lora_name,
          lora_id,
          fixed_prompt,
          created_lead_id
        `)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching all submissions:", error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        created_at: item.uploaded_at,
        edit_count: Array.isArray(item.edit_history) ? item.edit_history.length : 0,
        internal_team_notes: '',
  
        priority: 'Medium',
        submission_contact_name: '',
        submission_contact_email: '',
        submission_contact_phone: '',
        assigned_package_id_at_submission: null,
        clients: undefined,
        leads: undefined
      })) as Submission[];
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
