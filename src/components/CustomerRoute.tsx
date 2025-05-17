
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';

interface CustomerRouteProps {
  children: React.ReactNode;
}

export const CustomerRoute: React.FC<CustomerRouteProps> = ({ children }) => {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  // Debug logs
  useEffect(() => {
    console.log("CustomerRoute - Auth state:", { 
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
    console.log("Not authenticated, redirecting to login");
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("User is authenticated, rendering children");
  return <>{children}</>;
};
