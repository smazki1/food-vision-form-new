
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import AdminNavbar from "@/components/admin/AdminNavbar";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is authenticated as admin
  useEffect(() => {
    const checkAuth = () => {
      const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
      setIsAuthenticated(adminAuth);
      setIsChecking(false);
      
      if (!adminAuth) {
        console.log("Not authenticated as admin, redirecting to login");
        navigate("/admin-login");
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Show loading state while checking auth
  if (isChecking) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Only render the admin layout if authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 hidden md:block shadow-md">
        <AdminNavbar />
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
