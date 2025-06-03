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
          original_item_id,
          item_type,
          item_name_at_submission,
          assigned_package_id_at_submission,
          submission_status,
          uploaded_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          edit_count,
          final_approval_timestamp,
          internal_team_notes,
          assigned_editor_id,
          target_completion_date,
          priority,
          created_lead_id,
          submission_contact_name,
          submission_contact_email,
          submission_contact_phone,
          lead_id,
          created_at,
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .order("uploaded_at", { ascending: false });

      if (error) {
        console.error("Error fetching all submissions:", error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        clients: Array.isArray(item.clients) && item.clients.length > 0 ? item.clients[0] : undefined,
        leads: Array.isArray(item.leads) && item.leads.length > 0 ? item.leads[0] : undefined
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
