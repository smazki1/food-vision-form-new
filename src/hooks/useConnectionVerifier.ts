import { useState, useEffect, useRef } from 'react';
import { clientAuthService } from '@/services/clientAuthService';

/**
 * Hook to verify database connection with timeout
 */
export const useConnectionVerifier = (
  onConnectionError: (error: string) => void
) => {
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);
  const [connectionChecked, setConnectionChecked] = useState<boolean>(false);

  // Use a ref to store the latest onConnectionError callback
  const onConnectionErrorRef = useRef(onConnectionError);
  useEffect(() => {
    onConnectionErrorRef.current = onConnectionError;
  }, [onConnectionError]);

  // Test database connection on mount
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - useEffect for connection test RUNS");
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | undefined = undefined; // Define timeoutId here
    const startTime = Date.now();
    
    const performCleanup = () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };

    timeoutId = setTimeout(() => {
      if (isMounted && !connectionChecked) {
        console.warn("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection check timed out after 5s");
        if (!connectionVerified) { // Only if not already successfully verified
            setConnectionVerified(true); // Or consider false if timeout is a hard failure for verification
            onConnectionErrorRef.current("Database connection check timed out. Some features may be limited.");
        }
        setConnectionChecked(true);
      }
    }, 5000);
    
    const testConnection = async () => {
      try {
        const { success, error: connError } = await clientAuthService.testDatabaseConnection();
        if (!isMounted) return;
        clearTimeout(timeoutId); // Clear timeout as soon as test finishes
        
        const duration = Date.now() - startTime;
        console.log(`[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection test completed in ${duration}ms`);
        
        if (connError) {
          onConnectionErrorRef.current(`Database connection error: ${connError.message}`);
          setConnectionVerified(false);
        } else {
          setConnectionVerified(true);
          onConnectionErrorRef.current('');
        }
        setConnectionChecked(true);

      } catch (err) {
        if (!isMounted) return;
        clearTimeout(timeoutId); // Clear timeout on error too
        console.error("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection test exception:", err);
        setConnectionVerified(false);
        setConnectionChecked(true);
        onConnectionErrorRef.current(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        
        // This timeout for forcing true might be problematic, consider removing if not essential for offline
        setTimeout(() => {
          if (isMounted && !connectionVerified) {
            console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - Forcing connection verification to true after exception.");
            setConnectionVerified(true);
          } 
        }, 500);
      }
    };
    
    if (!connectionChecked) { // Only run the test if not already checked in this effect cycle
    testConnection();
    } else {
        console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - Skipping testConnection, already checked.");
    }
    
    return performCleanup;
  }, []);

  return connectionVerified;
};
