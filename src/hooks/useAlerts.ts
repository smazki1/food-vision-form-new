import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { Alert } from '@/types/alert';
import { generateAlertsFromData } from '@/utils/alertsGenerator';

export function useAlerts() {
  const { data: leadsData = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['leads-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Lead[];
    }
  });

  const { data: clientsData = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-for-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('client_id, restaurant_name, remaining_servings')
        .lt('remaining_servings', 5);

      if (error) throw error;
      return data;
    }
  });

  const alerts = generateAlertsFromData(leadsData, clientsData);
  const upcomingReminders = leadsData.filter(lead => 
    lead.reminder_at && new Date(lead.reminder_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  );

  return {
    alerts,
    upcomingReminders,
    loading: leadsLoading || clientsLoading,
    markAsViewed: (alertId: string) => {
      // Implementation for marking alerts as viewed
      console.log('Marking alert as viewed:', alertId);
    }
  };
}
