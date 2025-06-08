import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUserRole, CurrentUserRoleStatus, CurrentUserRoleState } from "@/hooks/useCurrentUserRole";
import { NotificationCenter } from "@/components/admin/notifications/NotificationCenter";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { MobileLoading } from "@/components/ui/mobile-loading";
import { supabase } from "@/integrations/supabase/client";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  const currentUserState: CurrentUserRoleState = useCurrentUserRole();
  const { status, isAdmin, isAccountManager, role, error: roleError, userId } = currentUserState;

  console.log("[AdminLayout] Current auth state (simplified - layout trusts AdminRoute for gating):", {
    status,
    isAdmin,
    isAccountManager,
    role,
    userId,
    error: roleError,
  });

  console.log("[AdminLayout] Rendering admin layout (assuming AdminRoute granted access).");

  const handleLogout = async () => {
    console.log("[AdminLayout] handleLogout called");
    
    // Clear local storage
    localStorage.removeItem("adminAuthenticated");
    localStorage.removeItem("adminAuthTime");
    
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[AdminLayout] Logout error:", error);
      toast.error("Logout failed: " + error.message);
    } else {
      toast.info("התנתקת בהצלחה");
    }
    navigate("/admin-login");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <AdminSidebar onLogout={handleLogout} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Navigation */}
        <div className="md:hidden">
          <AdminMobileNav onLogout={handleLogout} />
        </div>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-2 sm:p-3 md:p-6">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
