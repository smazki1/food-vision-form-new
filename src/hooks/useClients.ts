
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientStatus } from "@/types/client";
import { useCurrentUserRole } from "./useCurrentUserRole";

interface UseClientsOptions {
  searchTerm?: string;
  statusFilter?: string;
}

export function useClients({ searchTerm = "", statusFilter = "all" }: UseClientsOptions = {}) {
  const queryClient = useQueryClient();
  const { isAdmin, isAccountManager } = useCurrentUserRole();
  
  const {
    data: clients = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["clients", searchTerm, statusFilter],
    queryFn: async () => {
      // If not admin or account manager, don't fetch the data
      if (!isAdmin && !isAccountManager) {
        return [];
      }
      
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter if selected and is a valid status
      if (statusFilter && statusFilter !== "all") {
        // Validate the status filter is one of the allowed enum values
        if (["פעיל", "לא פעיל", "בהמתנה"].includes(statusFilter)) {
          query = query.eq("client_status", statusFilter as ClientStatus);
        }
      }

      // Apply search term if entered
      if (searchTerm) {
        query = query.or(
          `restaurant_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as Client[];
    },
    enabled: isAdmin || isAccountManager
  });
  
  const refreshClients = () => {
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  };
  
  return {
    clients,
    isLoading,
    error,
    refetch,
    refreshClients
  };
}
