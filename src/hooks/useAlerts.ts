import { useState, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { generateAlertsFromData } from "@/utils/alertsGenerator";
import { Alert } from "@/types/alert";
import { Lead, Client } from "@/types/models";

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { leads = [] } = useLeads({});
  const { clients = [] } = useClients();

  // Transform leads to ensure compatibility with alertsGenerator
  const transformedLeads: Lead[] = leads.map(lead => ({
    ...lead,
    lead_id: lead.lead_id || lead.id || '',
    id: lead.id || lead.lead_id,
    phone: lead.phone || lead.phone_number || '',
    phone_number: lead.phone_number || lead.phone,
    updated_at: lead.updated_at || lead.last_updated_at || new Date().toISOString(),
    last_updated_at: lead.last_updated_at || lead.updated_at,
    reminder_at: lead.reminder_at || null,
    reminder_details: lead.reminder_details || null,
    notes: lead.notes || '',
    ai_trainings_count: lead.ai_trainings_count || 0,
    ai_training_cost_per_unit: lead.ai_training_cost_per_unit || 0,
    ai_prompts_count: lead.ai_prompts_count || 0,
    ai_prompt_cost_per_unit: lead.ai_prompt_cost_per_unit || 0,
    free_sample_package_active: lead.free_sample_package_active || false
  }));

  // Transform clients to ensure compatibility
  const transformedClients: Client[] = clients.map(client => ({
    ...client,
    internal_notes: client.internal_notes || '',
    email_notifications: client.email_notifications || false,
    app_notifications: client.app_notifications || false
  }));

  useEffect(() => {
    const generatedAlerts = generateAlertsFromData(transformedLeads, transformedClients);
    setAlerts(generatedAlerts);
  }, [leads, clients]);

  const upcomingReminders = leads.filter(lead => lead.reminder_at);

  return { alerts, upcomingReminders };
}
