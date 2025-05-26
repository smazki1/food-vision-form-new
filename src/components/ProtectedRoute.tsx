
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
  const { user, loading: authLoading, initialized, isAuthenticated } = useUnifiedAuth();
  const { 
    clientId, 
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
    clientId, clientAuthLoading, clientRecordStatus, errorState,
      loadingTimedOut,
    pathname: location.pathname,
    timestamp: Date.now()
  });

  // Condition 1: Show loading UI if basic auth isn't done, OR if client auth is still actively loading its record.
  // We consider client auth done loading if clientAuthLoading is false OR if loadingTimedOut is true.
  const stillLoading = !loadingTimedOut && 
                       (!initialized || authLoading || (clientAuthLoading && clientRecordStatus === 'loading'));

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
  console.log("[AUTH_DEBUG] ProtectedRoute - Past loading phase. Final check for redirection.", {
    isAuthenticated, clientId, clientAuthLoading, clientRecordStatus, errorState
  });

  // Condition 2: If not authenticated after all loading attempts, redirect to login.
  if (!isAuthenticated) {
    console.log("[AUTH_DEBUG] ProtectedRoute - NOT Authenticated. Redirecting to /customer-login.");
    // Toast logic from original code can be added here if needed for non-authenticated redirect
    return <Navigate to="/customer-login" state={{ from: location }} replace />;
  }

  // If we reach here: User IS Authenticated.
  // Render the children or Outlet. The presence or absence of clientId will be handled by the specific page.
  console.log("[AUTH_DEBUG] ProtectedRoute - Authenticated. Rendering content.", {
    clientId, clientRecordStatus, errorState
  });
    
  // Optional: Show a non-blocking toast if there was an error resolving client info but user is auth'd.
  if (errorState && clientRecordStatus === 'error') {
    toast.error(`Profile loading error: ${errorState}. Some features might be limited.`, { duration: 7000 });
    }
  // Optional: Toast if authenticated but no client record yet (if relevant for user experience).
  else if (!clientId && clientRecordStatus === 'not-found' && !clientAuthLoading) {
     console.warn("[AUTH_DEBUG] ProtectedRoute - Authenticated user has no linked client record. This is expected if it's a new user or record needs creation/linking on a specific page.");
     // toast.info("Complete your profile or first submission to link your account fully.", { duration: 5000 });
    }
    
    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
