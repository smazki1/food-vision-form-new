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
    error 
  } = useCurrentUserRole();
  const location = useLocation();

  console.log('[AdminRoute] State from useCurrentUserRole:', { isLoading, isAdmin, isAccountManager, status, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  if (error && (status === 'ERROR_SESSION' || status === 'ERROR_FETCHING_ROLE')) {
    console.error('[AdminRoute] Auth error from useCurrentUserRole:', error);
    toast.error(`Authentication error: ${error}. Please try logging in again.`);
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  
  if (!isAdmin) {
    console.warn('[AdminRoute] Access Denied. User is not admin. Current role status:', status);
    toast.error("Access Denied: You do not have admin privileges.");
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  console.log('[AdminRoute] Access GRANTED. Rendering children.');
  return <>{children}</>;
};

export default AdminRoute;
