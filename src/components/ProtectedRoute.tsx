
import React, { useState, useEffect } from 'react';
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

  // Use an effect to handle navigation logic separately from rendering
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Auth state check:", {
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
      currentPath: location.pathname
    });

    // Only make routing decisions when auth state is fully initialized and not loading
    if (initialized && !authLoading) {
      // If not authenticated and not at login already, prepare for redirect
      if (!isAuthenticated && location.pathname !== '/login') {
        console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Not authenticated, will redirect");
        
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
  }, [user, authLoading, initialized, isAuthenticated, location.pathname, clientId, hasLinkedClientRecord, hasNoClientRecord, clientRecordStatus, clientAuthLoading, errorState]);

  // Still initializing or loading - show loading UI
  if (!initialized || authLoading || clientAuthLoading) {
    console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Still loading auth state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Auth check complete, redirect if needed
  if (shouldRedirect && redirectPath) {
    console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Redirecting to:", redirectPath);
    // Store current location for return after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Auth check complete, user is authenticated - CRITICAL CHANGE: Always render content if authenticated,
  // even if clientId is null - this prevents redirect loops. The UI can handle displaying appropriate messages.
  if (isAuthenticated) {
    console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - User is authenticated, rendering protected content");
    console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Client record status:", clientRecordStatus);
    
    // Show a toast if there's an error state but still render content
    if (errorState) {
      toast.error(errorState, { duration: 6000 });
    }
    
    return <Outlet />;
  }

  // Fallback case - shouldn't normally reach here
  console.log("[AUTH_DEBUG_FINAL_] ProtectedRoute - Unexpected state, redirecting to login");
  return <Navigate to="/login" state={{ from: location }} replace />;
};
