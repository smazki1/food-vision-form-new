import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/supabaseAdmin";
import { UserRoleRecord } from "@/types/auth";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole.tsx";

export function useUserRoles() {
  const queryClient = useQueryClient();
  const { status: authStatus, isAdmin } = useCurrentUserRole();
  
  // Fetch all users with their roles
  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users with admin client:", authError);
        throw authError;
      }
      
      // Get user roles from our custom table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        console.error("Error fetching rolesData from user_roles:", rolesError);
        throw rolesError;
      }
      
      // Combine users with their roles
      const usersWithRoles = authUsers.users.map(user => {
        const userRoleRecord = rolesData?.find(role => role.user_id === user.id);
        return {
          ...user,
          role: userRoleRecord?.role
        };
      });
      
      return {
        users: usersWithRoles,
        roles: rolesData as UserRoleRecord[]
      };
    },
    enabled: authStatus === "ROLE_DETERMINED" && isAdmin,
    retry: 1,
  });
  
  // Assign role to user
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Check if user already has a role
      const { data: existingRole, error: fetchError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching existing role:", fetchError);
        throw fetchError;
      }
        
      if (existingRole) {
        // Update existing role
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role, updated_at: new Date().toISOString() })
          .eq('user_id', userId)
          .select('user_id, role')
          .single();
          
        if (error) {
          console.error("Error updating role:", error);
          throw error;
        }
        return data;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role, created_at: new Date().toISOString() })
          .select('user_id, role')
          .single();
          
        if (error) {
          console.error("Error inserting role:", error);
          throw error;
        }
        return data;
      }
    },
    onSuccess: (data) => {
      toast.success(`תפקיד המשתמש ל ID: ${data?.user_id} עודכן ל: ${data?.role}`);
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error) => {
      toast.error(`שגיאה בעדכון תפקיד המשתמש: ${error.message}`);
    }
  });
  
  // Remove role from user
  const removeRole = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      if (error) {
        console.error("Error deleting role:", error);
        throw error;
      }
      return userId;
    },
    onSuccess: (userId) => {
      toast.success(`תפקיד הוסר ממשתמש ID: ${userId}`);
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error) => {
      toast.error(`שגיאה בהסרת תפקיד המשתמש: ${error.message}`);
    }
  });

  return {
    userRoles,
    isLoading: isLoading || (authStatus !== "ROLE_DETERMINED" && authStatus !== "NO_SESSION" && authStatus !== "ERROR_SESSION" && authStatus !== "ERROR_FETCHING_ROLE" ),
    error: error || (authStatus === "ERROR_FETCHING_ROLE" ? new Error("Error fetching user role") : null),
    assignRole,
    removeRole
  };
}
