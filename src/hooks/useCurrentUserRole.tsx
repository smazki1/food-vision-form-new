
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCurrentUserRole() {
  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      // First check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log("[useCurrentUserRole] No active session");
        return null;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();
          
        if (error) {
          if (error.code === 'PGRST116') { // Record not found
            console.log("[useCurrentUserRole] No role found for user");
            return null;
          }
          console.error("[useCurrentUserRole] Error fetching user role:", error);
          throw error;
        }
        
        console.log("[useCurrentUserRole] Found role:", data?.role);
        return data?.role as UserRole;
      } catch (err) {
        console.error("[useCurrentUserRole] Exception:", err);
        return null;
      }
    },
    retry: 1,
  });
  
  return {
    role: userRole,
    isLoading,
    isAdmin: userRole === 'admin',
    isEditor: userRole === 'editor',
    isAccountManager: userRole === 'account_manager',
    error
  };
}
