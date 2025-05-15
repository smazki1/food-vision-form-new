
import { LeadStatus, LeadSource } from "@/types/lead";

export interface LeadsFilter {
  searchTerm?: string;
  leadStatus?: LeadStatus | "all";
  leadSource?: LeadSource | "all";
  dateFilter?: "today" | "this-week" | "this-month" | "all";
  onlyReminders?: boolean;
  remindersToday?: boolean;
}
