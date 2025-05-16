
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserRoleRecord } from "@/types/auth";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useUserRoles() {
  const queryClient = useQueryClient();
  
  // Fetch all users with their roles
  const { data: userRoles, isLoading, error } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        throw authError;
      }
      
      // Get user roles from our custom table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');
      
      if (rolesError) {
        throw rolesError;
      }
      
      // Combine users with their roles
      const usersWithRoles = authUsers.users.map(user => {
        const userRole = rolesData?.find(role => role.user_id === user.id);
        return {
          ...user,
          role: userRole?.role
        };
      });
      
      return {
        users: usersWithRoles,
        roles: rolesData as UserRoleRecord[]
      };
    },
    retry: 1,
  });
  
  // Assign role to user
  const assignRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (existingRole) {
        // Update existing role
        const { data, error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) throw error;
        return data;
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role })
          .select()
          .single();
          
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      toast.success('תפקיד המשתמש עודכן בהצלחה');
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
        
      if (error) throw error;
      return userId;
    },
    onSuccess: () => {
      toast.success('תפקיד המשתמש הוסר בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['user-roles'] });
    },
    onError: (error) => {
      toast.error(`שגיאה בהסרת תפקיד המשתמש: ${error.message}`);
    }
  });

  return {
    userRoles,
    isLoading,
    error,
    assignRole,
    removeRole
  };
}
