import { LeadSource, LeadStatus } from "./lead";
import { LeadStatusEnum, LeadSourceEnum } from './lead';

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

// Enhanced leads filters for the new advanced lead management system
export interface EnhancedLeadsFilter {
  searchTerm?: string;
  status?: LeadStatusEnum | 'all';
  leadSource?: string | 'all'; // Updated to use string for free text lead sources
  dateFilter?: 'today' | 'this-week' | 'this-month' | 'all';
  onlyReminders?: boolean;
  remindersToday?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  excludeArchived?: boolean;
  onlyArchived?: boolean;
  page?: number;
  pageSize?: number;
}
