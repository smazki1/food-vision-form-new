
import { useState, useEffect } from 'react';
import { clientAuthService } from '@/services/clientAuthService';

/**
 * Hook to verify database connection with timeout
 */
export const useConnectionVerifier = (
  onConnectionError: (error: string) => void
) => {
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);
  const [connectionChecked, setConnectionChecked] = useState<boolean>(false);

  // Test database connection on mount
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - Testing database connection");
    let isMounted = true;
    const startTime = Date.now();
    
    // Set timeout to avoid hanging on connection issues
    const timeoutId = setTimeout(() => {
      if (isMounted && !connectionChecked) {
        console.warn("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection check timed out after 5s");
        setConnectionVerified(true); // Force proceed but keep error state
        setConnectionChecked(true);
        onConnectionError("Database connection check timed out. Some features may be limited.");
      }
    }, 5000); // 5 second timeout
    
    const testConnection = async () => {
      try {
        const { success, error } = await clientAuthService.testDatabaseConnection();
        
        if (!isMounted) return;
        
        const duration = Date.now() - startTime;
        console.log(`[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection test completed in ${duration}ms`);
        setConnectionChecked(true);
        
        if (error) {
          onConnectionError(`Database connection error: ${error.message}`);
          setConnectionVerified(false);
        } else {
          setConnectionVerified(true);
          onConnectionError('');
        }
      } catch (err) {
        if (!isMounted) return;
        
        console.error("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection test exception:", err);
        setConnectionChecked(true);
        setConnectionVerified(false);
        onConnectionError(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // Force proceed after logging error
        setTimeout(() => {
          if (isMounted) {
            console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - Forcing connection verification to continue auth flow");
            setConnectionVerified(true);
          } 
        }, 2000);
      }
    };
    
    testConnection();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [onConnectionError]);

  return connectionVerified || connectionChecked;
};
