import { Lead } from "./models";
import { Client } from "./models";

export type AlertType = 
  | "new-lead" 
  | "reminder-due" 
  | "low-servings";

export type AlertSeverity = 
  | "high" 
  | "medium" 
  | "low";

export type AlertStatus = 
  | "new" 
  | "viewed" 
  | "dismissed" 
  | "actioned";

export interface BaseAlert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
  severity: AlertSeverity;
  status: AlertStatus;
}

export interface NewLeadAlert extends BaseAlert {
  type: "new-lead";
  leadId: string;
  restaurantName: string;
}

export interface ReminderDueAlert extends BaseAlert {
  type: "reminder-due";
  leadId: string;
  contactName: string;
  reminderDetails: string | null;
}

export interface LowServingsAlert extends BaseAlert {
  type: "low-servings";
  clientId: string;
  restaurantName: string;
  remainingServings: number;
}

export type Alert = NewLeadAlert | ReminderDueAlert | LowServingsAlert;

// Constants
export const LOW_SERVINGS_THRESHOLD = 3;
