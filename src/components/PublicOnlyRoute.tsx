
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

interface PublicOnlyRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

/**
 * Route component that only allows access when the user is NOT authenticated
 * Redirects authenticated users to their appropriate dashboard
 */
const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ 
  redirectPath = '/customer-dashboard',
  children
}) => {
  const { isAuthenticated, user, role, loading } = useUnifiedAuth();
  const location = useLocation();
  
  // Get intended destination from location state or use default
  const from = location.state?.from?.pathname || redirectPath;
  
  // While loading, render a minimal loading state to avoid flashes
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If authenticated, redirect to appropriate dashboard based on role
  if (isAuthenticated && user) {
    let dashboardPath;
    
    switch (role) {
      case 'admin':
        dashboardPath = '/admin';
        break;
      case 'editor':
        dashboardPath = '/editor/dashboard';
        break;
      case 'customer':
      default:
        dashboardPath = '/customer-dashboard';
    }
    
    console.log(`[PUBLIC_ROUTE] Authenticated ${role} user, redirecting to`, dashboardPath);
    return <Navigate to={dashboardPath} replace />;
  }
  
  // Not authenticated, allow access to public route
  return children ? <>{children}</> : <Outlet />;
};

export default PublicOnlyRoute;
