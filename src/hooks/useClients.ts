import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { useCurrentUserRole } from "./useCurrentUserRole";
import { useEffect } from "react";

export function useClients(/*{ searchTerm = "", statusFilter = "all" }: UseClientsOptions = {}*/) {
  const queryClient = useQueryClient();
  const currentUserRoleData = useCurrentUserRole(); 

  console.log('[useClients_Simplified] Hook called. Data from useCurrentUserRole():', JSON.stringify(currentUserRoleData, null, 2));

  const finalQueryKey = ["clients_simplified", currentUserRoleData.userId, currentUserRoleData.status];
  
  const isQueryEnabled = currentUserRoleData.status === "ROLE_DETERMINED" && (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager);

  console.log('[useClients_Simplified] Determined queryKey:', finalQueryKey, 'isQueryEnabled:', isQueryEnabled);
  
  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
    isFetching,
    status: queryStatus
  } = useQuery({
    queryKey: finalQueryKey, 
    queryFn: async () => {
      console.log('[useClients_Simplified] queryFn START. CurrentRoleData inside queryFn:', JSON.stringify(currentUserRoleData, null, 2));
      console.log('[useClients_Simplified] queryFn isQueryEnabled check (should be true if we are here):', isQueryEnabled);

      if (currentUserRoleData.status !== "ROLE_DETERMINED" || (!currentUserRoleData.isAdmin && !currentUserRoleData.isAccountManager)) { 
        console.warn('[useClients_Simplified] queryFn: Role not determined or not authorized INSIDE queryFn. Status:', currentUserRoleData.status, 'isAdmin:', currentUserRoleData.isAdmin);
        return [];
      }
      console.log('[useClients_Simplified] queryFn: Authorization check passed INSIDE queryFn.');
      
      let query = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      console.log('[useClients_Simplified] queryFn: Executing Supabase query...');
      const { data: rawData, error: queryError } = await query;
      console.log('[useClients_Simplified] queryFn: Supabase query FINISHED.');

      if (queryError) {
        console.error('[useClients_Simplified] queryFn: Error during Supabase query:', queryError);
        throw queryError;
      }

      console.log('[useClients_Simplified] queryFn: Supabase query successful. Returning data count:', rawData?.length);
      return rawData as Client[];
    },
    enabled: isQueryEnabled,
  });
  
  useEffect(() => {
    console.log('[useClients_Simplified] Query state: isLoading:', isLoading, 'isFetching:', isFetching, 'status:', queryStatus, 'error:', error, 'clients count:', clients.length);
  }, [isLoading, isFetching, queryStatus, error, clients]);
  
  const refreshClients = () => {
    console.log('[useClients_Simplified] refreshClients called. Invalidating queries for:', finalQueryKey);
    queryClient.invalidateQueries({ queryKey: finalQueryKey });
  };
  
  return {
    clients,
    isLoading,
    error,
    refetch,
    refreshClients
  };
}

// New hook
interface UseClientsSimplifiedV2Options {
  enabled: boolean;
  userId: string | null;
}

export function useClients_Simplified_V2({ enabled, userId }: UseClientsSimplifiedV2Options) {
  const queryClient = useQueryClient();

  // Use a more stable query key approach
  const queryKey = ["clients_list_for_admin", userId || "no-user"];

  console.log(`[useClients_Simplified_V2] Hook called. enabled: ${enabled}, userId: ${userId}, queryKey: ${JSON.stringify(queryKey)}`);

  // Make the query more resilient - enable if we have the enabled flag, regardless of userId changes
  const shouldEnableQuery = enabled && userId !== null;

  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
    isFetching,
    status: queryStatus
  } = useQuery<Client[], Error, Client[], readonly unknown[]>({
    queryKey: queryKey,
    queryFn: async () => {
      console.log('[useClients_Simplified_V2] queryFn START.');

      // Add additional check in queryFn for safety
      if (!userId) {
        console.warn('[useClients_Simplified_V2] queryFn: No userId provided, returning empty array');
        return [];
      }

      const queryBuilder = supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      console.log('[useClients_Simplified_V2] queryFn: Executing Supabase query...');
      const { data: rawData, error: queryError } = await queryBuilder;
      console.log('[useClients_Simplified_V2] queryFn: Supabase query FINISHED.');

      if (queryError) {
        console.error('[useClients_Simplified_V2] queryFn: Error during Supabase query:', queryError);
        throw new Error(queryError.message || 'Unknown database error');
      }

      console.log('[useClients_Simplified_V2] queryFn: Supabase query successful. Returning data count:', rawData?.length);
      return rawData || [];
    },
    enabled: shouldEnableQuery,
    // Add some stability options
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: 3, // Retry failed queries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  useEffect(() => {
    let errorMessage: string | null = null;
    if (error) {
      errorMessage = error.message;
    }
    console.log(`[useClients_Simplified_V2] Query state updated: isLoading: ${isLoading}, isFetching: ${isFetching}, status: ${queryStatus}, enabled: ${shouldEnableQuery}, error: ${errorMessage}, clients count: ${clients.length}`);
  }, [isLoading, isFetching, queryStatus, shouldEnableQuery, error, clients]);

  const refreshClients = () => {
    console.log('[useClients_Simplified_V2] refreshClients called. Invalidating queries for:', queryKey);
    queryClient.invalidateQueries({ queryKey: queryKey });
  };

  return {
    clients,
    isLoading,
    error,
    refetch,
    refreshClients,
    queryStatus,
    isFetching
  };
}
