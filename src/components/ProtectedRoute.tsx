
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = ['customer'] }) => {
  const { 
    user, 
    loading: authLoading, 
    initialized, 
    isAuthenticated, 
    clientId: unifiedClientId,
    role
  } = useUnifiedAuth();
  const { 
    clientId: clientAuthSpecificClientId, 
    authenticating: clientAuthLoading, 
    clientRecordStatus,
    errorState 
  } = useClientAuth();
  const location = useLocation();
  
  const loadingStartTimeRef = useRef<number>(Date.now());
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    const checkLoadingTimeout = () => {
      if ((!initialized || authLoading || clientAuthLoading) && !loadingTimedOut) {
        const loadingDuration = Date.now() - loadingStartTimeRef.current;
        if (loadingDuration > 5000) { // Reduced to 5 seconds
          console.warn("[AUTH_DEBUG] ProtectedRoute - Loading timeout exceeded 5s. Will proceed with current auth state.");
          setLoadingTimedOut(true);
        }
      }
    };

    const intervalId = setInterval(checkLoadingTimeout, 1000);
    return () => clearInterval(intervalId);
  }, [initialized, authLoading, clientAuthLoading, loadingTimedOut]);

  console.log("[AUTH_DEBUG] ProtectedRoute - State Check:", {
    isAuthenticated, authLoading, initialized,
    unifiedClientId,
    role,
    clientAuthSpecificClientId,
    clientAuthLoading, clientRecordStatus, errorState,
    loadingTimedOut,
    pathname: location.pathname,
    timestamp: Date.now()
  });

  // Simplified loading condition - force completion after timeout
  const stillLoading = !loadingTimedOut && 
                       (!initialized || authLoading || 
                        (clientAuthLoading && !clientRecordStatus));

  if (stillLoading) {
    const currentLoadingTime = Math.round((Date.now() - loadingStartTimeRef.current) / 1000);
    console.log("[AUTH_DEBUG] ProtectedRoute - Showing Loading UI...", { currentLoadingTime });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-3 text-sm text-muted-foreground">
            Loading... ({currentLoadingTime}s)
          </div>
        </div>
        {currentLoadingTime > 3 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading is taking longer than expected...
          </p>
        )}
      </div>
    );
  }

  console.log("[AUTH_DEBUG] ProtectedRoute - Past loading. Final check for redirection.", {
    isAuthenticated, unifiedClientId, role, clientAuthSpecificClientId, clientAuthLoading, clientRecordStatus, errorState
  });

  // Check authentication
  if (!isAuthenticated) {
    console.log("[AUTH_DEBUG] ProtectedRoute - NOT Authenticated. Redirecting to /customer-login.");
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  // For customer routes, ensure we have some form of client identification
  // Allow access if we have either unifiedClientId OR clientAuthSpecificClientId
  const effectiveClientId = unifiedClientId || clientAuthSpecificClientId;
  
  if (allowedRoles.includes('customer') && !effectiveClientId && clientRecordStatus === 'not-found') {
    console.warn("[AUTH_DEBUG] ProtectedRoute - Customer without client record, but allowing access with warning");
    // Allow access but show warning in the UI (handled by CustomerLayout)
  }

  // Role check - be more lenient, allow access if no role is set for customers
  if (allowedRoles.includes('customer') && role && role !== 'customer') {
    console.warn(`[AUTH_DEBUG] ProtectedRoute - User role '${role}' NOT customer. Redirecting.`);
    toast.error("Access Denied: Your user role does not permit access to this page.", { id: 'role-access-denied'});
    return <Navigate to="/" state={{ from: location }} replace />; 
  }
  
  console.log("[AUTH_DEBUG] ProtectedRoute - Authenticated and authorized. Rendering content.", {
    effectiveClientId, role, clientRecordStatus, errorState
  });
    
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
