
import { format, isToday, isPast, differenceInHours } from "date-fns";
import { Lead } from "@/types/models";
import { Client } from "@/types/models";
import { 
  Alert, 
  NewLeadAlert, 
  ReminderDueAlert, 
  LowServingsAlert, 
  LOW_SERVINGS_THRESHOLD 
} from "@/types/alert";
import { generateId } from "@/utils/generateId";

// Generate alerts from leads and clients data
export function generateAlertsFromData(
  leads: Lead[] = [], 
  clients: Client[] = []
): Alert[] {
  const alerts: Alert[] = [];
  
  // Add new leads alerts (leads created in the last 24 hours)
  const newLeadAlerts = generateNewLeadAlerts(leads);
  alerts.push(...newLeadAlerts);
  
  // Add reminder due alerts
  const reminderDueAlerts = generateReminderDueAlerts(leads);
  alerts.push(...reminderDueAlerts);
  
  // Add low servings alerts
  const lowServingsAlerts = generateLowServingsAlerts(clients);
  alerts.push(...lowServingsAlerts);
  
  // Sort alerts by timestamp (newest first)
  return alerts.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// Generate alerts for new leads (created within the last 24 hours)
function generateNewLeadAlerts(leads: Lead[]): NewLeadAlert[] {
  return leads
    .filter(lead => {
      // Filter leads that were created in the last 24 hours
      const hoursAgo = differenceInHours(new Date(), new Date(lead.created_at));
      return hoursAgo <= 24 && 
             lead.lead_status !== "הפך ללקוח" && 
             lead.lead_status !== "לא מעוניין";
    })
    .map(lead => ({
      id: generateId(),
      type: "new-lead",
      message: `ליד חדש: ${lead.restaurant_name}`,
      timestamp: lead.created_at,
      severity: "medium",
      status: "new",
      leadId: lead.id,
      restaurantName: lead.restaurant_name
    }));
}

// Generate alerts for due reminders (today or past)
function generateReminderDueAlerts(leads: Lead[]): ReminderDueAlert[] {
  return leads
    .filter(lead => {
      if (!lead.reminder_at) return false;
      
      const reminderDate = new Date(lead.reminder_at);
      return (isToday(reminderDate) || isPast(reminderDate)) && 
             lead.lead_status !== "הפך ללקוח" && 
             lead.lead_status !== "לא מעוניין";
    })
    .map(lead => ({
      id: generateId(),
      type: "reminder-due",
      message: `תזכורת לטיפול בליד: ${lead.contact_name}`,
      timestamp: lead.reminder_at || new Date().toISOString(),
      severity: "high",
      status: "new",
      leadId: lead.id,
      contactName: lead.contact_name,
      reminderDetails: lead.reminder_details
    }));
}

// Generate alerts for clients with low servings
function generateLowServingsAlerts(clients: Client[]): LowServingsAlert[] {
  return clients
    .filter(client => 
      client.client_status === "פעיל" && 
      client.remaining_servings > 0 && 
      client.remaining_servings < LOW_SERVINGS_THRESHOLD
    )
    .map(client => ({
      id: generateId(),
      type: "low-servings",
      message: `לקוח ${client.restaurant_name} עם פחות מ-${LOW_SERVINGS_THRESHOLD} מנות בחבילה`,
      timestamp: new Date().toISOString(),
      severity: "medium",
      status: "new",
      clientId: client.client_id,
      restaurantName: client.restaurant_name,
      remainingServings: client.remaining_servings
    }));
}

// Format date for display
export function formatAlertDate(dateString: string): string {
  return format(new Date(dateString), "dd/MM/yyyy HH:mm");
}
