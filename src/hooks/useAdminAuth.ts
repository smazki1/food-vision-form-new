import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      // Check if user has admin role in metadata
      const isUserAdmin = user.app_metadata?.role === 'admin';
      setIsAdmin(isUserAdmin);
      
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify admin role after login
      const isUserAdmin = data.user?.app_metadata?.role === 'admin';
      setIsAdmin(isUserAdmin);
      
      return { success: isUserAdmin, error: isUserAdmin ? null : "Not an admin user" };
    } catch (error) {
      console.error("Admin login error:", error);
      return { success: false, error };
    }
  };

  const adminLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAdmin(false);
      return { success: true, error: null };
    } catch (error) {
      console.error("Admin logout error:", error);
      return { success: false, error };
    }
  };

  return {
    isAdmin,
    loading,
    adminLogin,
    adminLogout,
  };
}; 