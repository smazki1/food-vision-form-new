import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

export interface DashboardStats {
  // KPIs
  totalLeads: number;
  totalActiveClients: number;
  newLeadsThisWeek: number;
  newLeadsThisMonth: number;
  submissionsInProgress: number;
  completedSubmissionsThisWeek: number;
  completedSubmissionsThisMonth: number;
  conversionRateThisMonth: number; // percentage
  
  // Lead Stats
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  
  // Client Stats
  clientsByPackage: { package_name: string; count: number }[];
  clientsByStatus: { status: string; count: number }[];
  inactiveClients: number; // no activity in 30 days
  
  // Workload Stats
  submissionsByStatus: { status: string; count: number }[];
  averageProcessingTimes: { item_type: string; days: number }[];
  dueTasks: { timeframe: string; count: number }[];
  
  // Editor Stats
  editorPerformance: { 
    editor_id: string; 
    editor_name: string;
    completed: number; 
    avg_time: number; 
    edit_rate: number 
  }[];
  
  // Package Stats
  packageUtilization: { 
    package_id: string;
    package_name: string;
    client_count: number;
    avg_remaining: number 
  }[];
  
  // Exception Stats
  overdueSubmissions: number;
  highEditSubmissions: number;
  lowServingsClients: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const oneWeekAgo = subDays(today, 7);
      const oneMonthAgo = subDays(today, 30);
      const startMonth = startOfMonth(today);
      const endMonth = endOfMonth(today);
      
      // Format dates for Supabase queries
      const todayStr = format(today, "yyyy-MM-dd");
      const oneWeekAgoStr = format(oneWeekAgo, "yyyy-MM-dd");
      const oneMonthAgoStr = format(oneMonthAgo, "yyyy-MM-dd");
      const startMonthStr = format(startMonth, "yyyy-MM-dd");
      const endMonthStr = format(endMonth, "yyyy-MM-dd");
      
      // Run parallel queries for efficiency
      const [
        leadsResult,
        newLeadsWeekResult,
        newLeadsMonthResult,
        activeClientsResult,
        submissionsInProgressResult,
        completedSubmissionsWeekResult,
        completedSubmissionsMonthResult,
        convertedLeadsMonthResult,
        leadsByStatusResult,
        leadsBySourceResult,
        clientsByStatusResult,
        inactiveClientsResult,
        submissionsByStatusResult,
        overdueSubmissionsResult,
        highEditSubmissionsResult,
        lowServingsClientsResult
      ] = await Promise.all([
        // Total leads
        supabase.from("leads").select("lead_id", { count: "exact", head: true }),
        
        // New leads this week
        supabase.from("leads")
          .select("lead_id", { count: "exact", head: true })
          .gte("created_at", oneWeekAgoStr),
          
        // New leads this month
        supabase.from("leads")
          .select("lead_id", { count: "exact", head: true })
          .gte("created_at", startMonthStr)
          .lte("created_at", endMonthStr),
        
        // Total active clients
        supabase.from("clients")
          .select("client_id", { count: "exact", head: true })
          .eq("client_status", "פעיל"),
          
        // Submissions in progress
        supabase.from("customer_submissions")
          .select("submission_id", { count: "exact", head: true })
          .in("submission_status", ["ממתינה לעיבוד", "בעיבוד", "הערות התקבלו"]),
          
        // Completed submissions this week
        supabase.from("customer_submissions")
          .select("submission_id", { count: "exact", head: true })
          .eq("submission_status", "הושלמה ואושרה")
          .gte("final_approval_timestamp", oneWeekAgoStr),
          
        // Completed submissions this month
        supabase.from("customer_submissions")
          .select("submission_id", { count: "exact", head: true })
          .eq("submission_status", "הושלמה ואושרה")
          .gte("final_approval_timestamp", startMonthStr)
          .lte("final_approval_timestamp", endMonthStr),
          
        // Converted leads this month (for conversion rate)
        supabase.from("leads")
          .select("lead_id", { count: "exact", head: true })
          .eq("lead_status", "הפך ללקוח")
          .gte("updated_at", startMonthStr)
          .lte("updated_at", endMonthStr),
          
        // Leads by status
        supabase.from("leads")
          .select("lead_status")
          .then(({ data, error }) => {
            if (error) throw error;
            const counts: Record<string, number> = {};
            data.forEach(lead => {
              counts[lead.lead_status] = (counts[lead.lead_status] || 0) + 1;
            });
            return Object.entries(counts).map(([status, count]) => ({ status, count }));
          }),
          
        // Leads by source
        supabase.from("leads")
          .select("lead_source")
          .then(({ data, error }) => {
            if (error) throw error;
            const counts: Record<string, number> = {};
            data.forEach(lead => {
              if (lead.lead_source) {
                counts[lead.lead_source] = (counts[lead.lead_source] || 0) + 1;
              }
            });
            return Object.entries(counts).map(([source, count]) => ({ source, count }));
          }),
          
        // Clients by status
        supabase.from("clients")
          .select("client_status")
          .then(({ data, error }) => {
            if (error) throw error;
            const counts: Record<string, number> = {};
            data.forEach(client => {
              counts[client.client_status] = (counts[client.client_status] || 0) + 1;
            });
            return Object.entries(counts).map(([status, count]) => ({ status, count }));
          }),
          
        // Inactive clients (no activity in 30 days)
        supabase.from("clients")
          .select("client_id", { count: "exact", head: true })
          .lt("last_activity_at", oneMonthAgoStr)
          .eq("client_status", "פעיל"),
          
        // Submissions by status
        supabase.from("customer_submissions")
          .select("submission_status")
          .then(({ data, error }) => {
            if (error) throw error;
            const counts: Record<string, number> = {};
            data.forEach(submission => {
              counts[submission.submission_status] = (counts[submission.submission_status] || 0) + 1;
            });
            return Object.entries(counts).map(([status, count]) => ({ status, count }));
          }),
          
        // Overdue submissions
        supabase.from("customer_submissions")
          .select("submission_id", { count: "exact", head: true })
          .not("target_completion_date", "is", null)
          .lt("target_completion_date", todayStr)
          .not("submission_status", "eq", "הושלמה ואושרה"),
          
        // High edit submissions (more than 3 edit rounds)
        supabase.from("customer_submissions")
          .select("submission_id", { count: "exact", head: true })
          .gte("edit_count", 3),
          
        // Clients with low remaining servings
        supabase.from("clients")
          .select("client_id", { count: "exact", head: true })
          .eq("client_status", "פעיל")
          .lte("remaining_servings", 3)
          .gt("remaining_servings", 0)
      ]);
      
      // For the clients by package, we need to fetch separately due to the join
      const { data: clientsByPackageData } = await supabase
        .from('clients')
        .select('current_package_id, service_packages!inner(package_name)')
        .not('current_package_id', 'is', null);

      let clientsByPackage: { package_name: string; count: number }[] = [];
      
      if (clientsByPackageData) {
        // Process the data to count clients per package
        const packageCounts: Record<string, { name: string, count: number }> = {};
        
        clientsByPackageData.forEach((client: any) => {
          const packageId = client.current_package_id;
          const packageName = client.service_packages.package_name;
          
          if (!packageCounts[packageId]) {
            packageCounts[packageId] = { name: packageName, count: 0 };
          }
          
          packageCounts[packageId].count += 1;
        });
        
        clientsByPackage = Object.entries(packageCounts).map(([id, data]) => ({
          package_name: data.name,
          count: data.count
        }));
      }
      
      // Calculate conversion rate
      const newLeadsMonth = newLeadsMonthResult.count || 0;
      const convertedLeadsMonth = convertedLeadsMonthResult.count || 0;
      const conversionRate = newLeadsMonth > 0 
        ? (convertedLeadsMonth / newLeadsMonth) * 100 
        : 0;
      
      // Mock data for statistics that would require more complex queries
      // In a production environment, these would be calculated from actual data
      const averageProcessingTimes = [
        { item_type: "dish", days: 2.7 },
        { item_type: "cocktail", days: 1.9 },
        { item_type: "drink", days: 1.5 }
      ];
      
      const dueTasks = [
        { timeframe: "היום", count: 5 },
        { timeframe: "השבוע", count: 12 },
        { timeframe: "שבוע הבא", count: 8 }
      ];
      
      const editorPerformance = [
        { editor_id: "1", editor_name: "דניאל", completed: 35, avg_time: 1.8, edit_rate: 15 },
        { editor_id: "2", editor_name: "מיכאל", completed: 42, avg_time: 2.2, edit_rate: 8 },
        { editor_id: "3", editor_name: "רותם", completed: 28, avg_time: 1.5, edit_rate: 12 }
      ];
      
      const packageUtilization = [
        { package_id: "1", package_name: "בסיסי", client_count: 18, avg_remaining: 4.2 },
        { package_id: "2", package_name: "מתקדם", client_count: 24, avg_remaining: 7.8 },
        { package_id: "3", package_name: "פרימיום", client_count: 9, avg_remaining: 12.3 }
      ];
      
      return {
        totalLeads: leadsResult.count || 0,
        totalActiveClients: activeClientsResult.count || 0,
        newLeadsThisWeek: newLeadsWeekResult.count || 0,
        newLeadsThisMonth: newLeadsMonthResult.count || 0,
        submissionsInProgress: submissionsInProgressResult.count || 0,
        completedSubmissionsThisWeek: completedSubmissionsWeekResult.count || 0,
        completedSubmissionsThisMonth: completedSubmissionsMonthResult.count || 0,
        conversionRateThisMonth: parseFloat(conversionRate.toFixed(1)),
        
        leadsByStatus: leadsByStatusResult,
        leadsBySource: leadsBySourceResult,
        clientsByPackage,
        clientsByStatus: clientsByStatusResult,
        inactiveClients: inactiveClientsResult.count || 0,
        
        submissionsByStatus: submissionsByStatusResult,
        averageProcessingTimes,
        dueTasks,
        
        editorPerformance,
        packageUtilization,
        
        overdueSubmissions: overdueSubmissionsResult.count || 0,
        highEditSubmissions: highEditSubmissionsResult.count || 0,
        lowServingsClients: lowServingsClientsResult.count || 0
      };
    },
    refetchInterval: 1000 * 60 * 5, // Refresh every 5 minutes
  });
}
