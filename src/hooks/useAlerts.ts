
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLeads } from "@/hooks/useLeads";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertType } from "@/types/alert";
import { Client } from "@/types/client";
import { generateAlertsFromData } from "@/utils/alertsGenerator";

interface UseAlertsOptions {
  typeFilter?: AlertType | "all";
}

export function useAlerts({ typeFilter = "all" }: UseAlertsOptions = {}) {
  // Local state for managing alert status
  const [viewedAlerts, setViewedAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  
  // Get leads data from useLeads hook
  const { leads = [] } = useLeads();
  
  // Fetch clients data
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*");
        
      if (error) throw error;
      return data as Client[];
    }
  });
  
  // Generate alerts from leads and clients data
  const allAlerts = useMemo(() => 
    generateAlertsFromData(leads, clients),
    [leads, clients]
  );
  
  // Apply filters and status
  const filteredAlerts = useMemo(() => {
    return allAlerts
      .filter(alert => {
        // Apply type filter
        if (typeFilter !== "all" && alert.type !== typeFilter) {
          return false;
        }
        
        // Filter out dismissed alerts
        if (dismissedAlerts.has(alert.id)) {
          return false;
        }
        
        return true;
      })
      .map(alert => ({
        ...alert,
        // Apply viewed status
        status: viewedAlerts.has(alert.id) ? "viewed" : alert.status
      }));
  }, [allAlerts, typeFilter, viewedAlerts, dismissedAlerts]);
  
  // Get upcoming reminders (today and future)
  const upcomingReminders = useMemo(() => {
    return leads.filter(lead => {
      if (!lead.next_follow_up_date) return false; // Use next_follow_up_date from models
      
      const reminderDate = new Date(lead.next_follow_up_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return reminderDate >= today;
    });
  }, [leads]);
  
  // Helper functions for managing alert states
  const markAsViewed = (alertId: string) => {
    setViewedAlerts(prev => new Set(prev).add(alertId));
  };
  
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };
  
  const markAllAsViewed = () => {
    const newViewedAlerts = new Set(viewedAlerts);
    filteredAlerts.forEach(alert => {
      newViewedAlerts.add(alert.id);
    });
    setViewedAlerts(newViewedAlerts);
  };
  
  return {
    alerts: filteredAlerts,
    allAlertsCount: allAlerts.length,
    filteredAlertsCount: filteredAlerts.length,
    upcomingReminders,
    markAsViewed,
    dismissAlert,
    markAllAsViewed
  };
}
