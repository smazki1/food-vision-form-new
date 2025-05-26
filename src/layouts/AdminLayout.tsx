
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
  const [forcedReady, setForcedReady] = useState(false);

  const currentUserState: CurrentUserRoleState = useCurrentUserRole();
  const { status, isAdmin, isAccountManager, role, error: roleError, userId } = currentUserState;

  // Force ready state after 8 seconds for mobile (shorter timeout)
  useEffect(() => {
    const forceReadyTimer = setTimeout(() => {
      console.warn("[AdminLayout] Forcing ready state after 8 seconds for mobile optimization");
      setForcedReady(true);
    }, 8000);

    return () => clearTimeout(forceReadyTimer);
  }, []);

  useEffect(() => {
    console.log("[AdminLayout] useEffect triggered. Status:", status, "isAdmin:", isAdmin, "isAccountManager:", isAccountManager, "forcedReady:", forcedReady);

    if (status === "ROLE_DETERMINED" || forcedReady) {
      if ((!isAdmin && !isAccountManager) && !forcedReady) {
        console.log("[AdminLayout] Access DENIED. User ID:", userId, "Role:", role);
        toast.error("Access Denied: Insufficient privileges.");
        navigate("/admin-login");
      }
    } else if (status === "NO_SESSION") {
      console.log("[AdminLayout] No session. Navigating to login.");
      toast.info("Please log in to access the admin area.");
      navigate("/admin-login");
    } else if (status === "ERROR_SESSION" || status === "ERROR_FETCHING_ROLE") {
      console.error("[AdminLayout] Error state reached:", status, "Error:", roleError);
      toast.error(`Authentication error: ${roleError || 'Please try again.'}`);
      navigate("/admin-login");
    }
  }, [status, isAdmin, isAccountManager, navigate, userId, role, roleError, forcedReady]);

  const isLoadingView = (status === "INITIALIZING" || status === "CHECKING_SESSION" || status === "FETCHING_ROLE") && !forcedReady;

  if (isLoadingView) {
    console.log("[AdminLayout] Rendering mobile-optimized loading view. Status:", status);
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <MobileLoading 
          message="Loading Admin Dashboard..." 
          size="lg"
          className="min-h-[300px]"
        />
      </div>
    );
  }

  const isAuthorizedToRenderOutlet = (status === "ROLE_DETERMINED" && (isAdmin || isAccountManager)) || forcedReady;

  if (!isAuthorizedToRenderOutlet) {
    console.log("[AdminLayout] Not authorized. Status:", status);
    return (
      <div className="flex items-center justify-center h-screen">
        <MobileLoading 
          message="Verifying access..." 
          size="md"
        />
      </div>
    );
  }

  console.log("[AdminLayout] Authorized. Rendering admin layout.");

  const handleLogout = async () => {
    console.log("[AdminLayout] handleLogout called");
    const { error } = await supabase.auth.signOut();
    if (error) {
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
      
      {/* Mobile Navigation */}
      <div className="md:hidden w-full">
        <AdminMobileNav onLogout={handleLogout} />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-3 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
