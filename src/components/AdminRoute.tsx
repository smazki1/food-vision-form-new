import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { 
    isAdmin,
    isAccountManager,
    isLoading,
    status,
    error,
    role 
  } = useCurrentUserRole();
  const location = useLocation();

  // Simple loading state for reasonable time
  if (isLoading && ['INITIALIZING', 'CHECKING_SESSION', 'FETCHING_ROLE'].includes(status)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">
          Verifying admin access...
        </p>
      </div>
    );
  }

  // Check localStorage fallback if auth fails
  if (error && (status === 'ERROR_SESSION' || status === 'ERROR_FETCHING_ROLE')) {
    console.error('[AdminRoute] Auth error:', error);
    
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth) {
      console.warn('[AdminRoute] Auth error but localStorage shows admin - allowing access');
      return <>{children}</>;
    }
    
    toast.error(`Authentication error: ${error}. Please try logging in again.`);
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  
  // Check admin access - explicitly exclude editors
  if (!isAdmin && !isAccountManager) {
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth) {
      console.warn('[AdminRoute] Role check failed but localStorage admin exists - allowing access');
      return <>{children}</>;
    }
    
    // If user is editor, redirect to editor dashboard
    if (role === 'editor') {
      console.warn('[AdminRoute] Editor trying to access admin area - redirecting to editor dashboard');
      toast.error("Access Denied: Editors should use the editor dashboard.");
      return <Navigate to="/editor" replace />;
    }
    
    console.warn('[AdminRoute] Access Denied. User is not admin. Role:', role);
    toast.error("Access Denied: You do not have admin privileges.");
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
