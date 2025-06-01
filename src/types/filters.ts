
import { LeadSource, LeadStatus } from "./lead";

export interface LeadsFilter {
  searchTerm?: string;
  leadStatus?: LeadStatus | "all";
  leadSource?: LeadSource | "all";
  dateFilter?: "today" | "this-week" | "this-month" | "all";
  onlyReminders?: boolean;
  remindersToday?: boolean;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface DashboardSettings {
  sections: {
    id: string;
    title: string;
    visible: boolean;
    order: number;
  }[];
}
