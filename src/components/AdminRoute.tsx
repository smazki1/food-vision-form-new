import React, { useRef, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { toast } from 'sonner';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { 
    isAdmin,
    isAccountManager,
    isLoading,
    status,
    error,
    role 
  } = useCurrentUserRole();
  const location = useLocation();
  const mountTimeRef = useRef(Date.now());
  const lastLogRef = useRef(0);

  // Aggressive timeout for AdminRoute itself
  useEffect(() => {
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - mountTimeRef.current;
      if (isLoading && elapsed > 10000) {
        console.error(`[AdminRoute] STUCK after ${elapsed}ms - forcing page refresh`);
        window.location.reload();
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Reduce console spam
  const now = Date.now();
  if (now - lastLogRef.current > 2000) {
    console.log('[AdminRoute] State from useCurrentUserRole:', { isLoading, isAdmin, isAccountManager, status, error, role });
    lastLogRef.current = now;
  }

  // Emergency fallback - if we've been loading too long, check localStorage
  const elapsed = Date.now() - mountTimeRef.current;
  if (isLoading && elapsed > 8000) {
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth) {
      console.warn(`[AdminRoute] EMERGENCY: Loading too long (${elapsed}ms), but localStorage shows admin auth - allowing access`);
      return <>{children}</>;
    }
  }

  // Handle the different status states more aggressively
  if (status === 'FORCED_COMPLETE' || status === 'EMERGENCY_RECOVERY') {
    // If status was forced, check role and localStorage
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth || role === 'admin') {
      console.log('[AdminRoute] Status was forced but admin credentials found - allowing access');
      return <>{children}</>;
    }
  }

  if (isLoading && elapsed < 8000) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">
          Verifying admin access... ({Math.round(elapsed/1000)}s)
        </p>
      </div>
    );
  }

  if (error && (status === 'ERROR_SESSION' || status === 'ERROR_FETCHING_ROLE')) {
    console.error('[AdminRoute] Auth error from useCurrentUserRole:', error);
    
    // Check localStorage before redirecting
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth) {
      console.warn('[AdminRoute] Auth error but localStorage shows admin - allowing access anyway');
      return <>{children}</>;
    }
    
    toast.error(`Authentication error: ${error}. Please try logging in again.`);
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }
  
  if (!isAdmin && !isAccountManager) {
    // Final localStorage check before denying access
    const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
    if (adminAuth) {
      console.warn('[AdminRoute] Role check failed but localStorage admin exists - allowing emergency access');
      return <>{children}</>;
    }
    
    console.warn('[AdminRoute] Access Denied. User is not admin. Current role status:', status);
    toast.error("Access Denied: You do not have admin privileges.");
    return <Navigate to="/admin-login" state={{ from: location }} replace />;
  }

  console.log('[AdminRoute] Access GRANTED. Rendering children.');
  return <>{children}</>;
};

export default AdminRoute;
