
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCustomerAuth } from "./useCustomerAuth";
import { useClientAuth } from "./useClientAuth";

interface AuthRedirectOptions {
  redirectPath?: string;
  showWarnings?: boolean;
}

/**
 * Hook to handle authentication-based redirects
 */
export const useAuthRedirect = (options: AuthRedirectOptions = {}) => {
  const { 
    redirectPath = "/customer/dashboard", 
    showWarnings = true 
  } = options;
  
  const { isAuthenticated, initialized, loading, user } = useCustomerAuth();
  const { clientRecordStatus, errorState } = useClientAuth();
  const redirectAttempted = useRef(false);
  const navigate = useNavigate();

  // Handle redirection when authentication state changes
  useEffect(() => {
    // Log auth state to help track login flow
    console.log("[AUTH_DEBUG_FINAL_] useAuthRedirect - Auth check:", {
      isAuthenticated, 
      initialized, 
      loading, 
      userId: user?.id,
      clientRecordStatus,
      errorState,
      targetPath: redirectPath, 
      redirectAttempted: redirectAttempted.current
    });
    
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
    }
  }, [isAuthenticated, loading, initialized, navigate, redirectPath, user, clientRecordStatus, errorState, showWarnings]);

  return {
    redirectAttempted: redirectAttempted.current,
    isLoading: loading,
    isAuthenticated,
    initialized
  };
};
