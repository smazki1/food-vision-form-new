
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';

const IndexPage: React.FC = () => {
  const { isAuthenticated, loading, initialized, role } = useUnifiedAuth();

  console.log("[IndexPage] Auth state:", { isAuthenticated, loading, initialized, role });

  // Show loading while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'editor':
        return <Navigate to="/editor" replace />;
      case 'customer':
      default:
        return <Navigate to="/customer/dashboard" replace />;
    }
  }

  // If not authenticated, redirect to customer login
  return <Navigate to="/customer-login" replace />;
};

export default IndexPage;
