
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { NotificationCenter } from "@/components/admin/notifications/NotificationCenter";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { role, isLoading: isRoleLoading } = useCurrentUserRole();

  // Check if user is authenticated as admin and session is valid
  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
      const authTime = Number(localStorage.getItem("adminAuthTime") || "0");
      const currentTime = Date.now();
      const isSessionValid = adminAuth && (currentTime - authTime < SESSION_TIMEOUT);
      
      setIsAuthenticated(isSessionValid);
      setIsChecking(false);
      
      if (!isSessionValid) {
        if (adminAuth && !isSessionValid) {
          // Session expired
          localStorage.removeItem("adminAuthenticated");
          localStorage.removeItem("adminAuthTime");
          toast.error("הסשן פג תוקף, יש להתחבר מחדש");
        }
        console.log("Not authenticated as admin, redirecting to login");
        navigate("/admin-login");
      } else {
        console.log("Admin authentication confirmed");
      }
    };
    
    checkAuth();
    
    // Set up a timer to check auth periodically
    const authCheckTimer = setInterval(checkAuth, 60000); // Check every minute
    
    return () => {
      clearInterval(authCheckTimer);
    };
  }, [navigate]);

  // Redirect non-admin roles
  useEffect(() => {
    if (!isRoleLoading && role === 'editor' && !isChecking && isAuthenticated) {
      navigate("/editor/dashboard");
    }
  }, [role, isRoleLoading, navigate, isChecking, isAuthenticated]);

  // Show loading state while checking auth
  if (isChecking || isRoleLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Only render the admin layout if authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthTime");
    toast.info("התנתקת בהצלחה");
    navigate("/admin-login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="w-64 hidden md:block shadow-md">
        <AdminSidebar onLogout={handleLogout} />
      </div>
      
      {/* Mobile navigation */}
      <AdminMobileNav onLogout={handleLogout} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Desktop header */}
        <div className="hidden md:flex justify-end items-center border-b px-6 py-2">
          <NotificationCenter />
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
