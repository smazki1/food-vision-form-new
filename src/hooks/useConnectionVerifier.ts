import { useState, useEffect, useRef } from 'react';
import { clientAuthService } from '@/services/clientAuthService';

/**
 * Hook to verify database connection with aggressive timeout
 */
export const useConnectionVerifier = (
  onConnectionError: (error: string) => void
) => {
  const [connectionVerified, setConnectionVerified] = useState<boolean>(true);
  const [connectionChecked, setConnectionChecked] = useState<boolean>(true);

  // Use a ref to store the latest onConnectionError callback
  const onConnectionErrorRef = useRef(onConnectionError);
  useEffect(() => {
    onConnectionErrorRef.current = onConnectionError;
  }, [onConnectionError]);

  // Test database connection on mount with aggressive timeout
  useEffect(() => {
    console.log("[CONNECTION_VERIFIER] Starting connection test");
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | undefined = undefined;
    const startTime = Date.now();
    
    const performCleanup = () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };

    // Aggressive 2 second timeout
    timeoutId = setTimeout(() => {
      if (isMounted && !connectionChecked) {
        console.warn("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection check timed out after 5s");
        // If timed out, connection is NOT verified
        setConnectionVerified(false);
        onConnectionErrorRef.current("Database connection check timed out. Please check your internet connection.");
        setConnectionChecked(true);
      }
    }, 2000);
    
    const testConnection = async () => {
      try {
        const { success, error: connError } = await clientAuthService.testDatabaseConnection();
        if (!isMounted) return;
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        console.log(`[CONNECTION_VERIFIER] Connection test completed in ${duration}ms`);
        
        if (connError) {
          onConnectionErrorRef.current(`Database connection error: ${connError.message}`);
          setConnectionVerified(false);
        } else if (success) { // Ensure success is true as well
          setConnectionVerified(true);
          onConnectionErrorRef.current(''); // Clear any previous error
        } else {
          // If not an error but also not success (shouldn't happen with current service)
          onConnectionErrorRef.current('Database connection test was inconclusive.');
          setConnectionVerified(false);
        }
        setConnectionChecked(true);

      } catch (err) {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        console.warn("[CONNECTION_VERIFIER] Connection test failed, but continuing:", err);
        setConnectionVerified(false); // Explicitly set to false on catch, as per the spirit of 20cf3e4
        onConnectionErrorRef.current(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setConnectionChecked(true); 
      }
    };
    
    if (!connectionChecked) {
      testConnection();
    }
    
    return performCleanup;
  }, []);

  return connectionVerified;
};
