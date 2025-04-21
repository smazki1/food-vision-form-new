
import React, { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import AdminNavbar from "@/components/admin/AdminNavbar";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  // Check if user is authenticated as admin
  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true";
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [navigate]);

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
