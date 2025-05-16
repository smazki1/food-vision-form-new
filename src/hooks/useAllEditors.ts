
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";

type Editor = {
  id: string;
  email: string;
  name?: string;
  tasksCount: number;
};

export function useAllEditors() {
  const { data: editors = [], isLoading, error } = useQuery({
    queryKey: ["all-editors"],
    queryFn: async () => {
      // First, get all users with editor role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "editor");
        
      if (roleError) throw roleError;
      
      if (!roleData.length) return [];
      
      // Get editor user details from auth.users (admin required)
      const editorIds = roleData.map(role => role.user_id);
      
      // Get tasks count for each editor to show workload
      const { data: taskCountsData, error: taskError } = await supabase
        .from("customer_submissions")
        .select("assigned_editor_id, count")
        .in("assigned_editor_id", editorIds)
        .eq("submission_status", "בעיבוד")
        .group("assigned_editor_id");
        
      if (taskError) throw taskError;
      
      // Create a map of editor ID to task count
      const taskCountMap = Object.fromEntries(
        taskCountsData.map(item => [item.assigned_editor_id, parseInt(item.count)])
      );
      
      // Since we can't query auth.users directly, we'll fetch minimal data from auth via the admin API
      // For demo purposes, we'll create mock data based on user IDs
      const mockEditors: Editor[] = editorIds.map(id => ({
        id,
        email: `editor-${id.substring(0, 6)}@foodvision.ai`,
        name: `עורך ${id.substring(0, 4)}`,
        tasksCount: taskCountMap[id] || 0
      }));
      
      return mockEditors;
      
      // In a production environment, you would use the admin API:
      // const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
      // if (userError) throw userError;
      // const editors = userData.users.filter(user => 
      //   editorIds.includes(user.id)
      // ).map(editor => ({
      //   id: editor.id,
      //   email: editor.email,
      //   name: editor.user_metadata?.full_name,
      //   tasksCount: taskCountMap[editor.id] || 0
      // }));
      
      // return editors;
    },
  });

  return {
    editors,
    isLoading,
    error,
  };
}
