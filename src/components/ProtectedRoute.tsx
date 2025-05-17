
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { toast } from 'sonner';

export const ProtectedRoute = () => {
  const { user, loading, initialized, isAuthenticated } = useCustomerAuth();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Use an effect to handle navigation logic separately from rendering
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL_FIX] ProtectedRoute - Auth state check:", {
      userId: user?.id,
      isAuthenticated,
      loading,
      initialized,
      currentPath: location.pathname
    });

    // Only make routing decisions when auth state is fully initialized and not loading
    if (initialized && !loading) {
      // If not authenticated and not at login already, prepare for redirect
      if (!isAuthenticated && location.pathname !== '/login') {
        console.log("[AUTH_DEBUG_FINAL_FIX] ProtectedRoute - Not authenticated, will redirect");
        
        // Only show toast if not coming from a page load or direct URL access
        if (document.referrer) {
          toast.info('כניסה נדרשת כדי לגשת לדף זה');
        }
        
        setShouldRedirect(true);
        setRedirectPath('/login');
      } else {
        // Reset redirect state when authenticated
        setShouldRedirect(false);
        setRedirectPath(null);
      }
    }
  }, [user, loading, initialized, isAuthenticated, location.pathname]);

  // Still initializing or loading - show loading UI
  if (!initialized || loading) {
    console.log("[AUTH_DEBUG_FINAL_FIX] ProtectedRoute - Still loading auth state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auth check complete, redirect if needed
  if (shouldRedirect && redirectPath) {
    console.log("[AUTH_DEBUG_FINAL_FIX] ProtectedRoute - Redirecting to:", redirectPath);
    // Store current location for return after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Auth check complete, user is authenticated
  console.log("[AUTH_DEBUG_FINAL_FIX] ProtectedRoute - Rendering protected content");
  return <Outlet />;
};
