
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

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
  }, [user, loading, initialized, isAuthenticated, location.pathname]);

  // Case 1: Auth is still initializing - show loading
  if (loading || !initialized) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Still loading or initializing auth state, showing loading UI");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Case 2: Auth check is done, not authenticated
  if (!isAuthenticated) {
    console.log("[AUTH_DEBUG] ProtectedRoute - Not authenticated, redirecting to login");
    // Use { replace: true } to prevent adding to history stack, helping prevent redirect loops
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Case 3: Auth check is done, authenticated
  console.log("[AUTH_DEBUG] ProtectedRoute - User authenticated, rendering protected content");
  return <Outlet />;
};
