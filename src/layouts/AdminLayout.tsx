
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { toast } from "sonner";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

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

  // Show loading state while checking auth
  if (isChecking) {
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
      <div className="w-64 hidden md:block shadow-md">
        <AdminNavbar onLogout={handleLogout} />
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
