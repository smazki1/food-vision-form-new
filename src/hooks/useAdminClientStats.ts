import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientSubmissionStats {
  client_id: string;
  restaurant_name: string;
  package_name: string | null;
  total_submissions: number;
  statusCounts: {
    "ממתינה לעיבוד": number;
    "בעיבוד": number;
    "מוכנה להצגה": number;
    "הערות התקבלו": number;
    "הושלמה ואושרה": number;
  };
  remaining_servings: number;
  total_servings: number | null;
}

const validStatuses = [
  "ממתינה לעיבוד",
  "בעיבוד",
  "מוכנה להצגה",
  "הערות התקבלו",
  "הושלמה ואושרה"
] as const;

export function useAdminClientStats() {
  const { data: clientStats = [], isLoading: loading, error } = useQuery({
    queryKey: ['adminClientStats'],
    queryFn: async () => {
      console.log('[useAdminClientStats] Fetching client statistics');

      // First get all active clients with their package info
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select(`
          client_id,
          restaurant_name,
          remaining_servings,
          current_package_id,
          service_packages:current_package_id (
            package_name,
            total_servings
          )
        `)
        .eq("client_status", "פעיל");

      if (clientsError) {
        console.error("[useAdminClientStats] Error fetching clients:", clientsError);
        throw clientsError;
      }

      // Get all submissions for these clients
      const { data: submissions, error: submissionsError } = await supabase
        .from("customer_submissions")
        .select(`
          client_id,
          submission_status
        `);

      if (submissionsError) {
        console.error("[useAdminClientStats] Error fetching submissions:", submissionsError);
        throw submissionsError;
      }

      console.log('[useAdminClientStats] Clients found:', clients?.length || 0);
      console.log('[useAdminClientStats] Submissions found:', submissions?.length || 0);

      // Process the data to create comprehensive stats
      const clientStatsMap = new Map<string, ClientSubmissionStats>();

      // Initialize client stats
      (clients || []).forEach(client => {
        const statusCounts = validStatuses.reduce((acc, status) => {
          acc[status] = 0;
          return acc;
        }, {} as Record<typeof validStatuses[number], number>);

        const packageInfo = Array.isArray(client.service_packages) ? client.service_packages[0] : client.service_packages;
        
        clientStatsMap.set(client.client_id, {
          client_id: client.client_id,
          restaurant_name: client.restaurant_name || 'ללא שם',
          package_name: packageInfo?.package_name || null,
          total_submissions: 0,
          statusCounts: statusCounts as ClientSubmissionStats['statusCounts'],
          remaining_servings: client.remaining_servings || 0,
          total_servings: packageInfo?.total_servings || null
        });
      });

      // Count submissions by status for each client
      (submissions || []).forEach(submission => {
        const clientStat = clientStatsMap.get(submission.client_id);
        if (clientStat && validStatuses.includes(submission.submission_status as any)) {
          clientStat.total_submissions++;
          clientStat.statusCounts[submission.submission_status as keyof ClientSubmissionStats['statusCounts']]++;
        }
      });

      const results = Array.from(clientStatsMap.values())
        .sort((a, b) => b.total_submissions - a.total_submissions); // Sort by most submissions first

      console.log('[useAdminClientStats] Final client stats:', results);
      return results;
    },
    staleTime: 1000 * 60 * 2, // Fresh for 2 minutes
    refetchInterval: 1000 * 60 * 5, // Auto-refresh every 5 minutes
  });

  return {
    clientStats,
    loading,
    error
  };
} 