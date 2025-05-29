
import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: string[];
}

// Reduce timeout to 3 seconds for better user experience
const LOADING_TIMEOUT = 3000;

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
    if ((!initialized || authLoading || clientAuthLoading) && !loadingTimedOut) {
      const timeoutId = setTimeout(() => {
        console.warn(`[AUTH_DEBUG] ProtectedRoute - Loading timeout exceeded ${LOADING_TIMEOUT/1000}s. Proceeding with current state.`);
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

  // Show loading only if we haven't timed out and are still loading
  const stillLoading = !loadingTimedOut && 
                       (!initialized || authLoading || 
                        (clientAuthLoading && clientRecordStatus === 'loading'));

  if (stillLoading) {
    const currentLoadingTime = Math.round((Date.now() - loadingStartTimeRef.current) / 1000);
    console.log("[AUTH_DEBUG] ProtectedRoute - Showing Loading UI...", { currentLoadingTime });
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-3 text-sm text-muted-foreground">
            טוען... ({currentLoadingTime}s)
          </div>
        </div>
        {currentLoadingTime > 2 && (
          <p className="mt-4 text-sm text-muted-foreground">
            הטעינה לוקחת זמן רב מהצפוי...
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
  const effectiveClientId = unifiedClientId || clientAuthSpecificClientId;
  
  if (allowedRoles.includes('customer') && !effectiveClientId && clientRecordStatus === 'not-found') {
    console.warn("[AUTH_DEBUG] ProtectedRoute - Customer without client record, but allowing access with warning");
  }

  // Role check - be more lenient for customers
  if (allowedRoles.includes('customer') && role && role !== 'customer') {
    console.warn(`[AUTH_DEBUG] ProtectedRoute - User role '${role}' NOT customer. Redirecting.`);
    toast.error("הגישה נדחתה: תפקיד המשתמש אינו מאפשר גישה לדף זה.", { id: 'role-access-denied'});
    return <Navigate to="/" state={{ from: location }} replace />; 
  }
  
  console.log("[AUTH_DEBUG] ProtectedRoute - Authenticated and authorized. Rendering content.", {
    effectiveClientId, role, clientRecordStatus, errorState
  });
    
  // Show informative toasts for edge cases
  if (errorState && clientRecordStatus === 'error') {
    toast.error(`היתה בעיה בטעינת פרטי הפרופיל: ${errorState}. פונקציות הליבה אמורות לעבוד.`, { duration: 7000, id: 'client-auth-error-toast' });
  }
    
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
