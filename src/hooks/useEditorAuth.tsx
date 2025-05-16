
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

// Session timeout in milliseconds (1 hour)
const SESSION_TIMEOUT = 60 * 60 * 1000;

export function useEditorAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { role, isLoading: isRoleLoading } = useCurrentUserRole();
  
  // Check if user is authenticated as editor
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
      const authTime = Number(localStorage.getItem("adminAuthTime") || "0");
      const currentTime = Date.now();
      const isSessionValid = adminAuth && (currentTime - authTime < SESSION_TIMEOUT);
      
      if (!isSessionValid || !data.session) {
        setIsAuthenticated(false);
        setIsChecking(false);
        navigate("/admin-login");
        return;
      }
      
      setIsAuthenticated(true);
      setIsChecking(false);
    };
    
    checkAuth();
    
    // Set up a timer to check auth periodically
    const authCheckTimer = setInterval(checkAuth, 60000); // Check every minute
    
    return () => {
      clearInterval(authCheckTimer);
    };
  }, [navigate]);
  
  // Check if user has editor role
  useEffect(() => {
    if (!isRoleLoading && role !== 'editor' && !isChecking && isAuthenticated) {
      toast.error("אין לך הרשאות גישה לאזור העורכים");
      navigate("/admin/dashboard");
    }
  }, [role, isRoleLoading, isAuthenticated, isChecking, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthTime");
    toast.info("התנתקת בהצלחה");
    navigate("/admin-login");
  };
  
  return {
    isAuthenticated,
    isChecking,
    role,
    isRoleLoading,
    handleLogout
  };
}
