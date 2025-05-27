import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

// Reduce timeout to 5 seconds for better user experience
const LOADING_TIMEOUT = 5000;

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

  // Force timeout after LOADING_TIMEOUT ms rather than using interval checks
  useEffect(() => {
    if ((!initialized || authLoading || clientAuthLoading) && !loadingTimedOut) {
      const timeoutId = setTimeout(() => {
        console.warn(`[AUTH_DEBUG] ProtectedRoute - Overall loading timeout exceeded ${LOADING_TIMEOUT/1000}s. Will proceed with current auth state.`);
        setLoadingTimedOut(true);
      }, LOADING_TIMEOUT);
      
      return () => clearTimeout(timeoutId);
    }
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

  // Condition 1: Show loading UI if not timed out and unified auth isn't done
  // We completely ignore clientAuthLoading state to prevent getting stuck
  const stillLoading = !loadingTimedOut && (!initialized || authLoading);

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
        {currentLoadingTime > 2 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Loading is taking longer than expected...
          </p>
        )}
      </div>
    );
  }

  // At this point, either all loading is done or we've timed out
  console.log("[AUTH_DEBUG] ProtectedRoute - Past useUnifiedAuth loading. Final check for redirection.", {
    isAuthenticated, unifiedClientId, role, clientAuthSpecificClientId, clientAuthLoading, clientRecordStatus, errorState,
    note: "EMERGENCY FIX: Ignoring clientAuthLoading for access control"
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
