
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientStatus } from "@/types/client";

interface UseClientsOptions {
  searchTerm?: string;
  statusFilter?: string;
}

export function useClients({ searchTerm = "", statusFilter = "" }: UseClientsOptions = {}) {
  return useQuery({
    queryKey: ["clients", searchTerm, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply status filter if selected and is a valid status
      if (statusFilter && statusFilter !== "הכל") {
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
    }
  });
}
