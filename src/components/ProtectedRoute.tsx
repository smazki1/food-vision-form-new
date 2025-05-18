import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';

export const ProtectedRoute = () => {
  const { user, loading: authLoading, initialized, isAuthenticated } = useCustomerAuth();
  const { 
    clientId, 
    authenticating: clientAuthLoading, 
    hasLinkedClientRecord, 
    hasNoClientRecord,
    clientRecordStatus,
    errorState 
  } = useClientAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  
  // Track loading time to implement timeout
  const loadingStartTimeRef = useRef<number>(Date.now());
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  // Check for loading timeout
  useEffect(() => {
    if (!initialized || authLoading || clientAuthLoading) {
      // Set a timeout to force completion if loading takes too long
      const timeoutId = setTimeout(() => {
        const loadingDuration = Date.now() - loadingStartTimeRef.current;
        if (loadingDuration > 10000) { // 10 seconds timeout
          console.warn("[AUTH_DEBUG] ProtectedRoute - Loading timeout exceeded 10s, forcing completion");
          setLoadingTimedOut(true);
        }
      }, 10000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [initialized, authLoading, clientAuthLoading]);

  // Use an effect to handle navigation logic separately from rendering
  useEffect(() => {
    console.log("[AUTH_DEBUG] ProtectedRoute - Auth state check:", {
      userId: user?.id,
      isAuthenticated,
      authLoading,
      clientAuthLoading,
      clientId,
      hasLinkedClientRecord,
      hasNoClientRecord,
      clientRecordStatus,
      errorState,
      initialized,
      loadingTimedOut,
      timestamp: Date.now(),
      currentPath: location.pathname
    });

    // Only make routing decisions when auth state is fully initialized or timeout occurred
    if ((initialized && !authLoading) || loadingTimedOut) {
      // If not authenticated and not at login already, prepare for redirect
      if (!isAuthenticated && location.pathname !== '/login') {
        console.log("[AUTH_DEBUG] ProtectedRoute - Not authenticated, will redirect");
        
        // Only show toast if not coming from a page load or direct URL access
        if (document.referrer) {
          const lastToastTime = sessionStorage.getItem('last_auth_toast_time');
          const currentTime = Date.now();
          if (!lastToastTime || currentTime - parseInt(lastToastTime) > 5000) {
            toast.info('כניסה נדרשת כדי לגשת לדף זה');
            sessionStorage.setItem('last_auth_toast_time', currentTime.toString());
          }
        }
        
        setShouldRedirect(true);
        setRedirectPath('/login');
      } else {
        // Reset redirect state when authenticated
        setShouldRedirect(false);
        setRedirectPath(null);
      }
    }
  }, [user, authLoading, initialized, isAuthenticated, location.pathname, clientId, hasLinkedClientRecord, hasNoClientRecord, clientRecordStatus, clientAuthLoading, errorState, loadingTimedOut]);

  // Calculate current loading time for display
  const currentLoadingTime = Math.round((Date.now() - loadingStartTimeRef.current) / 1000);

  // Still initializing or loading - show loading UI, unless timed out
  if ((!initialized || authLoading || clientAuthLoading) && !loadingTimedOut) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Still loading auth state", {
      elapsedTime: currentLoadingTime + 's'
    });
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

  // Auth check complete, redirect if needed
  if (shouldRedirect && redirectPath) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Redirecting to:", redirectPath);
    // Store current location for return after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // EXPLICIT CHECK: Authentication is complete and user is authenticated
  if (isAuthenticated || (loadingTimedOut && user)) {
    console.log("[AUTH_DEBUG] ProtectedRoute - User is authenticated or loading timed out with user present, rendering protected content");
    
    // Show a toast if there's an error state but still render content
    if (errorState) {
      toast.error(errorState, { duration: 6000 });
    }
    
    // Additional check: if authenticated but no clientId and all loading done
    if (isAuthenticated && !clientId && !clientAuthLoading && initialized) {
      console.error("[AUTH_DEBUG] ProtectedRoute - Authenticated user has no clientId after loading. Potential data issue or RLS problem.");
      toast.error("בעיה בטעינת נתוני המשתמש. אנא פנה לתמיכה.");
    }
    
    return <Outlet />;
  }

  // Fallback case - shouldn't normally reach here
  console.log("[AUTH_DEBUG] ProtectedRoute - Unexpected state, redirecting to login");
  return <Navigate to="/login" state={{ from: location }} replace />;
};