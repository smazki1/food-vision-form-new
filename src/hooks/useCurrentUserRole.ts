
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";

export function useCurrentUserRole() {
  const { data: userRole, isLoading, error } = useQuery({
    queryKey: ['current-user-role'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') { // Record not found
          return null;
        }
        throw error;
      }
      
      return data?.role as UserRole;
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
