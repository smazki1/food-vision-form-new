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
  
  // Timeout for overall loading to prevent getting stuck indefinitely
  const loadingStartTimeRef = useRef<number>(Date.now());
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    const checkLoadingTimeout = () => {
      if ((!initialized || authLoading || clientAuthLoading) && !loadingTimedOut) {
        const loadingDuration = Date.now() - loadingStartTimeRef.current;
        if (loadingDuration > 10000) { // 10 seconds timeout
          console.warn("[AUTH_DEBUG] ProtectedRoute - Overall loading timeout exceeded 10s. Will proceed with current auth state.");
          setLoadingTimedOut(true);
        }
      }
    };

    const intervalId = setInterval(checkLoadingTimeout, 1000); // Check every second
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

  // Condition 1: Show loading UI if basic auth isn't done, OR if client auth is still actively loading its record.
  // We consider client auth done loading if clientAuthLoading is false OR if loadingTimedOut is true.
  const stillLoading = !loadingTimedOut && 
                       (!initialized || authLoading);

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
        {currentLoadingTime > 5 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading is taking longer than expected...
          </p>
        )}
      </div>
    );
  }

  // At this point, all initial loading attempts are considered "done" (either completed or timed out).
  console.log("[AUTH_DEBUG] ProtectedRoute - Past useUnifiedAuth loading. Final check for redirection.", {
    isAuthenticated, unifiedClientId, role, clientAuthSpecificClientId, clientAuthLoading, clientRecordStatus, errorState
  });

  // Condition 2: If not authenticated after all loading attempts, redirect to login.
  if (!isAuthenticated) {
    console.log("[AUTH_DEBUG] ProtectedRoute - NOT Authenticated (from useUnifiedAuth). Redirecting to /customer-login.");
    // Toast logic from original code can be added here if needed for non-authenticated redirect
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  // User is authenticated by useUnifiedAuth
  // Check role and presence of unifiedClientId if role requires it (e.g. customer)
  if (allowedRoles.includes('customer') && role === 'customer' && !unifiedClientId) {
    console.error("[AUTH_DEBUG] ProtectedRoute - Authenticated customer MISSING unifiedClientId. This is unexpected and might indicate an issue with the auth state propagation or initial setup.");
    toast.error("User profile error. Please try logging in again or contact support if the issue persists.", { id: 'profile-error-unified-cid'});
    // Depending on how critical this is, you might clear auth state or guide user differently.
    // For now, redirecting to login might allow a fresh auth flow.
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  // Role check (generic, if more roles are added or if allowedRoles is more dynamic)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
      console.warn(`[AUTH_DEBUG] ProtectedRoute - User role '${role}' NOT in allowedRoles (${allowedRoles.join(', ')}). Redirecting.`);
      toast.error("Access Denied: Your user role does not permit access to this page.", { id: 'role-access-denied'});
      // Consider redirecting to a general access denied page, user's default dashboard, or home page
      // Redirecting to '/' might be a safe default if no specific 'access-denied' page exists
      return <Navigate to="/" state={{ from: location }} replace />; 
  }
  
  // If we reach here: User IS Authenticated by useUnifiedAuth, and if customer, unifiedClientId is present.
  // Role is also appropriate for the route.
  console.log("[AUTH_DEBUG] ProtectedRoute - Authenticated and authorized by useUnifiedAuth. Rendering content.", {
    unifiedClientId, role, clientAuthSpecificClientId, clientRecordStatus, errorState
  });
    
  // Optional: Show a non-blocking toast if there was an error resolving specific client info from useClientAuth
  // This provides feedback without blocking the UI, as the core auth check (unified) has passed.
  if (errorState && clientRecordStatus === 'error') {
    toast.error(`There was an issue loading some additional profile details: ${errorState}. Core functionalities should work, but some specific info might be unavailable.`, { duration: 7000, id: 'client-auth-error-toast' });
  }
  // Optional: Toast if authenticated (unified) but useClientAuth reports no client record yet and is not loading.
  // This is more of an informational message if the client record is expected to be eventually found by useClientAuth.
  else if (role === 'customer' && unifiedClientId && !clientAuthSpecificClientId && clientRecordStatus === 'not-found' && !clientAuthLoading) {
     console.warn("[AUTH_DEBUG] ProtectedRoute - useClientAuth reports no linked client record for this authenticated customer, though unifiedClientId is present. This might be a brief transitional state while client-specific data is fetched, or indicate a need to complete profile linking elsewhere if 'clients' table record isn't found by useClientDataFetcher.");
     // Example: toast.info("Finalizing your profile setup. Some specific details might take a moment to appear.", { duration: 5000, id: 'client-auth-not-found-toast' });
  }
    
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
