
import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUserRole, CurrentUserRoleStatus, CurrentUserRoleState } from "@/hooks/useCurrentUserRole";
import { NotificationCenter } from "@/components/admin/notifications/NotificationCenter";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import { supabase } from "@/integrations/supabase/client";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [forcedReady, setForcedReady] = useState(false);

  const currentUserState: CurrentUserRoleState = useCurrentUserRole();
  const { status, isAdmin, isAccountManager, role, error: roleError, userId } = currentUserState;

  // Force ready state after 10 seconds to prevent infinite loading
  useEffect(() => {
    const forceReadyTimer = setTimeout(() => {
      console.warn("[AdminLayout] Forcing ready state after 10 seconds to prevent infinite loading");
      setForcedReady(true);
    }, 10000);

    return () => clearTimeout(forceReadyTimer);
  }, []);

  useEffect(() => {
    console.log("[AdminLayout] useEffect triggered. Status:", status, "isAdmin:", isAdmin, "isAccountManager:", isAccountManager, "forcedReady:", forcedReady);

    // Only proceed with navigation logic if we have a determined state or forced ready
    if (status === "ROLE_DETERMINED" || forcedReady) {
      if ((!isAdmin && !isAccountManager) && !forcedReady) {
        console.log("[AdminLayout] Access DENIED (ROLE_DETERMINED but not admin/manager). User ID:", userId, "Role:", role);
        toast.error("Access Denied: Insufficient privileges.");
        navigate("/admin-login");
      }
      // If admin or manager, access is granted, no navigation needed from here.
    } else if (status === "NO_SESSION") {
      console.log("[AdminLayout] No session. Navigating to login.");
      toast.info("Please log in to access the admin area.");
      navigate("/admin-login");
    } else if (status === "ERROR_SESSION" || status === "ERROR_FETCHING_ROLE") {
      console.error("[AdminLayout] Error state reached:", status, "Error:", roleError);
      toast.error(`Authentication error: ${roleError || 'Please try again.'}`);
      navigate("/admin-login");
    }
    // Remove the catch-all navigation for unhandled status to prevent unnecessary redirects
  }, [status, isAdmin, isAccountManager, navigate, userId, role, roleError, forcedReady]);

  // Determine if the main content should be in a loading state
  const isLoadingView = (status === "INITIALIZING" || status === "CHECKING_SESSION" || status === "FETCHING_ROLE") && !forcedReady;

  if (isLoadingView) {
    console.log("[AdminLayout] Rendering loading view. Status:", status, "forcedReady:", forcedReady);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-xl mb-4">Loading Admin Dashboard...</div>
          <div className="text-sm text-muted-foreground">
            Status: {status}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            If this takes too long, please refresh the page
          </div>
        </div>
      </div>
    );
  }

  // At this point, status should be ROLE_DETERMINED, NO_SESSION, ERROR_SESSION, or ERROR_FETCHING_ROLE
  // The useEffect above handles navigation for NO_SESSION and ERROR states.
  // So, if we are here and not loading, we check for authorization to render Outlet.
  
  const isAuthorizedToRenderOutlet = (status === "ROLE_DETERMINED" && (isAdmin || isAccountManager)) || forcedReady;

  if (!isAuthorizedToRenderOutlet) {
    // This case should ideally be covered by navigation in useEffect, 
    // but as a fallback, show a generic message or redirect indicator.
    console.log("[AdminLayout] Not authorized to render Outlet (or in transient state post-loading). Status:", status, "isAdmin/isManager:", isAdmin, isAccountManager, "forcedReady:", forcedReady);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Verifying access...</div> 
      </div>
    );
  }

  // Only render the full layout with Outlet if authorized
  console.log("[AdminLayout] Authorized. Rendering full admin layout with Outlet. Status:", status, "forcedReady:", forcedReady);

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
      <AdminSidebar onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
