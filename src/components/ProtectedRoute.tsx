
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log("Not authenticated in ProtectedRoute, redirecting to login");
    // Save the attempted location so we can redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("User authenticated in ProtectedRoute:", user.id);
  return <Outlet />;
};
