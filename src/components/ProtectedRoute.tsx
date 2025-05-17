
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

export const ProtectedRoute = () => {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  useEffect(() => {
    console.log("ProtectedRoute - Auth check:", {
      userId: user?.id,
      isAuthenticated: !!user,
      loading,
      currentPath: location.pathname
    });
  }, [user, loading, location.pathname]);

  // To prevent authentication loops and race conditions:
  // 1. Show loading state while auth is being checked
  // 2. Only redirect if we're sure the user is not authenticated
  if (loading) {
    console.log("ProtectedRoute - Still loading auth state, showing loading UI");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Only redirect if authentication check is complete and user is not authenticated
  if (!user) {
    console.log("ProtectedRoute - Not authenticated, redirecting to login");
    // Use { replace: true } to prevent adding to history stack, helping prevent redirect loops
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute - User authenticated, rendering protected content");
  return <Outlet />;
};
