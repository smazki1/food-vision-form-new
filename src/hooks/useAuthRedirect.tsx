
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCustomerAuth } from "./useCustomerAuth";
import { useClientAuth } from "./useClientAuth";

interface AuthRedirectOptions {
  redirectPath?: string;
  showWarnings?: boolean;
  redirectTimeout?: number; // Add timeout option
}

/**
 * Hook to handle authentication-based redirects with timeout safeguard
 */
export const useAuthRedirect = (options: AuthRedirectOptions = {}) => {
  const { 
    redirectPath = "/customer/dashboard", 
    showWarnings = true,
    redirectTimeout = 5000 // Default 5 second timeout
  } = options;
  
  const { isAuthenticated, initialized, loading, user } = useCustomerAuth();
  const { clientRecordStatus, errorState, authenticating } = useClientAuth();
  const redirectAttempted = useRef(false);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Handle redirection when authentication state changes
  useEffect(() => {
    // Log auth state to help track login flow
    console.log("[AUTH_DEBUG_FINAL_] useAuthRedirect - Auth check:", {
      isAuthenticated, 
      initialized, 
      loading,
      authenticating,
      userId: user?.id,
      clientRecordStatus,
      errorState,
      targetPath: redirectPath, 
      redirectAttempted: redirectAttempted.current,
      timestamp: Date.now()
    });
    
    // Clear any existing timeout
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
    
    // Only redirect when fully authenticated and not in a loading state
    if (isAuthenticated && initialized && !loading && !redirectAttempted.current) {
      console.log("[AUTH_DEBUG_FINAL_] useAuthRedirect - User authenticated, redirecting to:", redirectPath);
      
      // Set the flag first to prevent multiple redirects
      redirectAttempted.current = true;
      
      // Use a small timeout to ensure all state updates are processed
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
        
        // Show a warning toast if authenticated but no client record is linked
        if (showWarnings && clientRecordStatus === 'not-found') {
          toast.warning("משתמש מאומת אך אין רשומת לקוח מקושרת. חלק מהתכונות עשויות להיות מוגבלות.", { duration: 6000 });
        }
        
        // Show an error toast if there's an error state
        if (showWarnings && errorState) {
          toast.error(errorState, { duration: 6000 });
        }
      }, 100);
      
      // Set a safeguard timeout to ensure redirect happens even if client auth hangs
      redirectTimeoutRef.current = setTimeout(() => {
        if (!redirectAttempted.current) {
          console.warn("[AUTH_DEBUG_FINAL_] useAuthRedirect - Redirect timeout reached, forcing redirect");
          redirectAttempted.current = true;
          navigate(redirectPath, { replace: true });
        }
      }, redirectTimeout);
    }
    
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, loading, initialized, navigate, redirectPath, user, clientRecordStatus, errorState, showWarnings, redirectTimeout, authenticating]);

  return {
    redirectAttempted: redirectAttempted.current,
    isLoading: loading || authenticating,
    isAuthenticated,
    initialized
  };
};
