import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth'; // For basic auth initialized and loading
import { useClientAuth } from '@/hooks/useClientAuth'; // For clientID and client authenticating
import { toast } from 'sonner';

export const ProtectedRoute = () => {
  const { user, initialized, loading: authLoading, isAuthenticated } = useCustomerAuth(); // Basic auth states, user included for logging
  const { clientId, authenticating } = useClientAuth(); // Client-specific states
  const location = useLocation();

  useEffect(() => {
    console.log("[AUTH_DEBUG] ProtectedRoute - State check:", {
      userId: user?.id, // Added userId for better debugging
      isAuthenticated,
      clientId,
      authenticating, // from client auth
      initialized,    // from basic auth
      authLoading,    // from basic auth
      currentPath: location.pathname
    });

    // Add guard to prevent multiple toasts
    // This condition ensures we only toast if all loading is done and user is not authenticated
    if (initialized && !authLoading && !authenticating && !isAuthenticated && location.pathname !== '/login') {
      const lastToastTime = sessionStorage.getItem('last_auth_toast_time');
      const currentTime = Date.now();
      if (!lastToastTime || currentTime - parseInt(lastToastTime) > 5000) {
        toast.info('כניסה נדרשת כדי לגשת לדף זה');
        sessionStorage.setItem('last_auth_toast_time', currentTime.toString());
      }
    }
  }, [user, isAuthenticated, clientId, authenticating, initialized, authLoading, location.pathname]);

  // Case 1: Auth is still initializing or loading (either basic or client-specific)
  if (!initialized || authLoading || authenticating) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Still loading or initializing auth/client state, showing loading UI");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Case 2: Auth check is done, but not authenticated OR no clientId
  if (!isAuthenticated || !clientId) {
    // User is authenticated, all loading done, but clientId is still null
    if (isAuthenticated && !clientId && initialized && !authLoading && !authenticating) {
      console.error("[AUTH_DEBUG] ProtectedRoute - Authenticated user (", user?.id, ") has no clientId after loading. Potential data issue or RLS problem.");
      toast.error("בעיה בטעינת נתוני המשתמש. אנא פנה לתמיכה.");
      // Potentially clear session storage for toast to show again if user retries immediately
      sessionStorage.removeItem('last_auth_toast_time'); 
    }
    console.log("[AUTH_DEBUG] ProtectedRoute - Not authenticated or no clientId, redirecting to login. IsAuthenticated:", isAuthenticated, "ClientId:", clientId);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Case 3: Auth check is done, authenticated, and clientId is present
  console.log("[AUTH_DEBUG] ProtectedRoute - User authenticated and clientId present, rendering protected content");
  return <Outlet />;
};
