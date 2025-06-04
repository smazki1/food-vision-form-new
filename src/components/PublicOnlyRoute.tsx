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
  redirectPath = '/customer/dashboard',
  children
}) => {
  const { isAuthenticated, user, role, loading, initialized } = useUnifiedAuth();
  const location = useLocation();
  
  // Get intended destination from location state or use default
  const from = location.state?.from?.pathname || redirectPath;
  
  // While loading, render a minimal loading state to avoid flashes
  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If authenticated, redirect to appropriate dashboard based on role
  if (isAuthenticated && user) {
    let dashboardPath;
    
    console.log(`[PUBLIC_ROUTE] Authenticated user with role: ${role}, determining redirect path`);
    
    switch (role) {
      case 'admin':
        dashboardPath = '/admin';
        break;
      case 'editor':
        dashboardPath = '/editor';
        break;
      case 'customer':
        dashboardPath = '/customer/dashboard';
        break;
      case null:
      case undefined:
        // If role is not determined yet, wait a bit longer or redirect to a safe default
        console.warn(`[PUBLIC_ROUTE] Authenticated user with null/undefined role - waiting for role determination`);
        if (initialized) {
          // If we're initialized but still no role, default to customer dashboard
          dashboardPath = '/customer/dashboard';
        } else {
          // Still initializing, show loading
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              <p className="ml-3 text-muted-foreground">Determining user role...</p>
            </div>
          );
        }
        break;
      default:
        console.warn(`[PUBLIC_ROUTE] Unknown role: ${role}, defaulting to customer dashboard`);
        dashboardPath = '/customer/dashboard';
    }
    
    console.log(`[PUBLIC_ROUTE] Authenticated ${role} user, redirecting to`, dashboardPath);
    
    // Force navigation for admin users
    if (role === 'admin' && dashboardPath === '/admin') {
      window.location.href = dashboardPath;
      return null;
    }
    
    return <Navigate to={dashboardPath} replace />;
  }
  
  // Not authenticated, allow access to public route
  return children ? <>{children}</> : <Outlet />;
};

export default PublicOnlyRoute;
