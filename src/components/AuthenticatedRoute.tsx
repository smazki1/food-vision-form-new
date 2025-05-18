
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { UserRole } from '@/types/unifiedAuthTypes';

interface AuthenticatedRouteProps {
  allowedRoles?: UserRole[];
  requireClientRecord?: boolean;
  redirectPath?: string;
  clientRedirectPath?: string;
}

export const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  allowedRoles = ['customer', 'admin', 'editor'],
  requireClientRecord = false,
  redirectPath = '/login',
  clientRedirectPath = '/account-setup'
}) => {
  const { 
    user, 
    role, 
    clientId,
    loading, 
    initialized, 
    isAuthenticated,
    hasLinkedClientRecord,
    authLoadingTimeout,
    clientAuthLoadingTimeout 
  } = useUnifiedAuth();
  
  const location = useLocation();
  const [loadingStartTime] = useState<number>(Date.now());
  
  // Log auth state for debugging
  useEffect(() => {
    console.log("[AUTH_ROUTE] Authentication state:", {
      userId: user?.id,
      role,
      clientId,
      isAuthenticated,
      initialized,
      loading,
      hasLinkedClientRecord,
      authLoadingTimeout,
      clientAuthLoadingTimeout,
      path: location.pathname,
      timestamp: Date.now()
    });
  }, [
    user, role, clientId, isAuthenticated, initialized, loading, 
    hasLinkedClientRecord, authLoadingTimeout, clientAuthLoadingTimeout, 
    location.pathname
  ]);
  
  // Calculate current loading time for display
  const currentLoadingTime = Math.round((Date.now() - loadingStartTime) / 1000);

  // Still initializing or loading - show loading UI, unless timed out
  if ((loading || !initialized) && !authLoadingTimeout) {
    console.log("[AUTH_ROUTE] Still loading auth state", { elapsedTime: currentLoadingTime + 's' });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-3 text-sm text-muted-foreground">
            Loading... ({currentLoadingTime}s)
          </div>
        </div>
        {currentLoadingTime > 5 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading is taking longer than expected...
          </p>
        )}
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    console.log("[AUTH_ROUTE] User not authenticated, redirecting to login");
    
    // Only show toast if not coming from a page load or direct URL access
    if (document.referrer) {
      toast.info('כניסה נדרשת כדי לגשת לדף זה');
    }
    
    // Store current location for return after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }
  
  // Check if user has an allowed role
  const hasAllowedRole = allowedRoles.includes(role as UserRole);
  if (!hasAllowedRole) {
    console.log("[AUTH_ROUTE] User role not allowed:", role);
    toast.error(`אין לך הרשאה לגשת לדף זה (${role} role)`);
    return <Navigate to="/" replace />;
  }
  
  // For customers, check if a client record is required but missing
  if (requireClientRecord && role === 'customer' && !hasLinkedClientRecord) {
    console.log("[AUTH_ROUTE] Client record required but missing, redirecting");
    
    if (!clientAuthLoadingTimeout) {
      toast.warning("יצירת רשומת לקוח נדרשת להמשך");
    }
    
    return <Navigate to={clientRedirectPath} state={{ from: location }} replace />;
  }

  // All checks passed, render the protected content
  console.log("[AUTH_ROUTE] Authentication checks passed, rendering content");
  return <Outlet />;
};
