
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Submission } from "@/api/submissionApi";
import { useClientAuth } from "./useClientAuth";

export function useSubmissions() {
  const { clientId } = useClientAuth();
  const queryClient = useQueryClient();
  
  const {
    data: submissions = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ["client-submissions", clientId],
    queryFn: async () => {
      if (!clientId) {
        console.log("[useSubmissions] No clientId available yet");
        return [];
      }

      console.log("[useSubmissions] Fetching submissions for clientId:", clientId);
      
      const { data, error } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name)
        `)
        .order("uploaded_at", { ascending: false });
        
      if (error) {
        console.error("[useSubmissions] Error fetching submissions:", error);
        throw error;
      }
      
      console.log("[useSubmissions] Fetched submissions:", data?.length || 0);
      return data as Submission[];
    },
    enabled: !!clientId
  });

  // Get remaining servings data
  const {
    data: clientData,
    isLoading: clientLoading
  } = useQuery({
    queryKey: ["client-remaining-servings", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      
      const { data, error } = await supabase
        .from("clients")
        .select("remaining_servings")
        .single();
        
      if (error) {
        console.error("[useSubmissions] Error fetching client data:", error);
        throw error;
      }
      
      return data;
    },
    enabled: !!clientId
  });

  const refreshSubmissions = () => {
    queryClient.invalidateQueries({ queryKey: ["client-submissions", clientId] });
    queryClient.invalidateQueries({ queryKey: ["client-remaining-servings", clientId] });
  };

  return {
    submissions,
    remainingServings: clientData?.remaining_servings || 0,
    loading: loading || clientLoading,
    error,
    refreshSubmissions
  };
}
