
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

export interface EditorPerformanceMetrics {
  editor_id: string;
  editor_name?: string;
  submissions_processed: number;
  average_processing_time_hours: number;
  edit_requests_handled: number;
  completion_rate: number;
  client_approval_rate: number;
}

/**
 * Service for generating editor performance reports
 */
export const performanceReportingService = {
  /**
   * Get performance metrics for all editors or a specific editor
   * @param editorId Optional ID of a specific editor
   * @param dateRange Optional date range for the report
   * @returns Promise resolving to editor performance metrics
   */
  getEditorPerformanceMetrics: async (
    editorId?: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<EditorPerformanceMetrics[]> => {
    const from = dateRange?.from || subDays(new Date(), 30);
    const to = dateRange?.to || new Date();
    
    const fromStr = format(from, "yyyy-MM-dd");
    const toStr = format(to, "yyyy-MM-dd");
    
    try {
      // Get all submissions completed in the date range
      let query = supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          assigned_editor_id,
          edit_history,
          submission_status,
          uploaded_at,
          final_approval_timestamp
        `)
        .gte('uploaded_at', fromStr)
        .lte('final_approval_timestamp', toStr);
      
      if (editorId) {
        query = query.eq('assigned_editor_id', editorId);
      } else {
        // Only fetch submissions that have an assigned editor
        query = query.not('assigned_editor_id', 'is', null);
      }
      
      const { data: submissions, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Group submissions by editor
      const editorSubmissions: Record<string, any[]> = {};
      
      submissions?.forEach(submission => {
        if (!submission.assigned_editor_id) return;
        
        if (!editorSubmissions[submission.assigned_editor_id]) {
          editorSubmissions[submission.assigned_editor_id] = [];
        }
        
        editorSubmissions[submission.assigned_editor_id].push(submission);
      });
      
      // Calculate metrics for each editor
      const editorMetrics: EditorPerformanceMetrics[] = [];
      
      for (const [editor_id, editorSubs] of Object.entries(editorSubmissions)) {
        const completedSubmissions = editorSubs.filter(sub => 
          sub.submission_status === "הושלמה ואושרה" || 
          sub.submission_status === "מוכנה להצגה"
        );
        
        const clientApprovedSubmissions = editorSubs.filter(sub => 
          sub.submission_status === "הושלמה ואושרה"
        );
        
        const editRequests = editorSubs.filter(sub => {
          const statusChanges = sub.edit_history?.status_changes || [];
          return statusChanges.some(change => change.to_status === "הערות התקבלו");
        });
        
        // Calculate average processing time in hours
        let totalProcessingTimeHours = 0;
        let submissionsWithProcessingTime = 0;
        
        completedSubmissions.forEach(sub => {
          if (sub.uploaded_at && sub.final_approval_timestamp) {
            const uploadDate = new Date(sub.uploaded_at);
            const approvalDate = new Date(sub.final_approval_timestamp);
            const diffMs = approvalDate.getTime() - uploadDate.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);
            totalProcessingTimeHours += diffHours;
            submissionsWithProcessingTime++;
          }
        });
        
        const avgProcessingTime = submissionsWithProcessingTime > 0
          ? totalProcessingTimeHours / submissionsWithProcessingTime
          : 0;
        
        editorMetrics.push({
          editor_id,
          submissions_processed: completedSubmissions.length,
          average_processing_time_hours: avgProcessingTime,
          edit_requests_handled: editRequests.length,
          completion_rate: editorSubs.length > 0 
            ? completedSubmissions.length / editorSubs.length
            : 0,
          client_approval_rate: completedSubmissions.length > 0
            ? clientApprovedSubmissions.length / completedSubmissions.length
            : 0
        });
      }
      
      // Fetch editor names
      for (const metrics of editorMetrics) {
        const { data: userData } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', metrics.editor_id)
          .single();
          
        if (userData) {
          // In a real app, you'd join with profiles table or another source of user names
          // For now, we'll just use the user ID as the name
          metrics.editor_name = userData.user_id;
        }
      }
      
      return editorMetrics;
    } catch (error) {
      console.error("Error generating performance metrics:", error);
      throw error;
    }
  }
};
