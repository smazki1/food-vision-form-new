
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
        .select('*')
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
    allAlertsCount: alerts.length,
    filteredAlertsCount: alerts.filter(alert => alert.status === 'new').length,
    markAsViewed: (alertId: string) => {
      console.log('Marking alert as viewed:', alertId);
    },
    dismissAlert: (alertId: string) => {
      console.log('Dismissing alert:', alertId);
    },
    markAllAsViewed: () => {
      console.log('Marking all alerts as viewed');
    }
  };
}
