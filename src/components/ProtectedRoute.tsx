
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { toast } from 'sonner';

export const ProtectedRoute = () => {
  const { user, loading, initialized, isAuthenticated } = useCustomerAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("[AUTH_DEBUG] ProtectedRoute - Auth check:", {
      userId: user?.id,
      isAuthenticated,
      loading,
      initialized,
      currentPath: location.pathname
    });

    // Add guard to prevent multiple toasts
    if (initialized && !loading && !isAuthenticated && location.pathname !== '/login') {
      // Use session storage to prevent showing toast multiple times in redirect scenarios
      const lastToastTime = sessionStorage.getItem('last_auth_toast_time');
      const currentTime = Date.now();
      if (!lastToastTime || currentTime - parseInt(lastToastTime) > 5000) {
        toast.info('כניסה נדרשת כדי לגשת לדף זה');
        sessionStorage.setItem('last_auth_toast_time', currentTime.toString());
      }
    }
  }, [user, loading, initialized, isAuthenticated, location.pathname]);

  // Case 1: Auth is still initializing or loading - show loading
  if (!initialized || loading) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Still loading or initializing auth state, showing loading UI");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Case 2: Auth check is done, not authenticated - redirect to login
  if (!isAuthenticated) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Not authenticated, redirecting to login with return URL:", location.pathname);
    
    // Store the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Case 3: Auth check is done, authenticated
  console.log("[AUTH_DEBUG] ProtectedRoute - User authenticated, rendering protected content");
  return <Outlet />;
};
