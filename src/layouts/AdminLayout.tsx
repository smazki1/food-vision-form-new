import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useCurrentUserRole, AuthRoleStatus, CurrentUserRoleState } from "@/hooks/useCurrentUserRole";
import { NotificationCenter } from "@/components/admin/notifications/NotificationCenter";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
// import { AdminHeader } from "@/components/admin/AdminHeader"; // Comment out for now
import { supabase } from "@/integrations/supabase/client";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  // const [pageLoading, setPageLoading] = useState(true); // pageLoading will now be derived from status

  const currentUserState: CurrentUserRoleState = useCurrentUserRole();
  const { status, isAdmin, isAccountManager, role, error: roleError, userId } = currentUserState;

  useEffect(() => {
    console.log("[AdminLayout] useEffect triggered. Status:", status, "isAdmin:", isAdmin, "isAccountManager:", isAccountManager);

    // Navigation logic based on status
    if (status === "ROLE_DETERMINED") {
      if (!isAdmin && !isAccountManager) {
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
    } else if (status !== "INITIALIZING" && status !== "CHECKING_SESSION" && status !== "FETCHING_ROLE") {
      // Catch any other unhandled status that isn't a loading state
      console.warn("[AdminLayout] Unhandled or unexpected status for navigation:", status);
      navigate("/admin-login");
    }
  }, [status, isAdmin, isAccountManager, navigate, userId, role, roleError]);

  // Determine if the main content should be in a loading state
  const isLoadingView = status === "INITIALIZING" || status === "CHECKING_SESSION" || status === "FETCHING_ROLE";

  if (isLoadingView) {
    console.log("[AdminLayout] Rendering loading view. Status:", status);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading Admin Dashboard...</div>
      </div>
    );
  }

  // At this point, status should be ROLE_DETERMINED, NO_SESSION, ERROR_SESSION, or ERROR_FETCHING_ROLE
  // The useEffect above handles navigation for NO_SESSION and ERROR states.
  // So, if we are here and not loading, we check for authorization to render Outlet.
  
  const isAuthorizedToRenderOutlet = status === "ROLE_DETERMINED" && (isAdmin || isAccountManager);

  if (!isAuthorizedToRenderOutlet) {
    // This case should ideally be covered by navigation in useEffect, 
    // but as a fallback, show a generic message or redirect indicator.
    console.log("[AdminLayout] Not authorized to render Outlet (or in transient state post-loading). Status:", status, "isAdmin/isManager:", isAdmin, isAccountManager);
    return (
      <div className="flex items-center justify-center h-screen">
        {/* Avoid showing "Redirecting..." if navigation hasn't happened yet for a valid error/no_session state */}
        <div className="text-xl">Verifying access...</div> 
      </div>
    );
  }

  // Only render the full layout with Outlet if authorized
  console.log("[AdminLayout] Authorized. Rendering full admin layout with Outlet. Status:", status);

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
        {/* <AdminHeader /> */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-6">
          <Outlet />
        </main>
        </div>

      {/* Temporary Debug Info Box - Commented out
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 220, 0.9)',
        padding: '15px',
        zIndex: 9999,
        border: '1px solid black',
        borderRadius: '5px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '5px', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Auth Debug Info (V2):</h4>
        <p>Status: {status}</p>
        <p>User ID: {userId || 'N/A'}</p>
        <p>Role: {role || 'N/A'}</p>
        <p>Is Admin: {String(isAdmin)}</p>
        <p>Is Account Mgr: {String(isAccountManager)}</p>
        <p>Error: {roleError || 'No error'}</p>
        <hr style={{margin: '5px 0'}} />
        <p>AdminLayout Status: pageLoading: {String(isLoadingView)}, Outlet Authorized: {String(isAuthorizedToRenderOutlet)}</p>
      </div>
      */}
    </div>
  );
};

export default AdminLayout;
