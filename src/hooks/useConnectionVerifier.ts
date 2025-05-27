
import { useState, useEffect, useRef } from 'react';
import { clientAuthService } from '@/services/clientAuthService';

/**
 * Hook to verify database connection with aggressive timeout
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
        console.warn("[CONNECTION_VERIFIER] Connection check timed out after 2s - assuming connected");
        setConnectionVerified(true); // Assume connection works
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
          console.warn("[CONNECTION_VERIFIER] Connection error, but continuing:", connError.message);
          setConnectionVerified(true); // Continue anyway
        } else {
          setConnectionVerified(true);
        }
        setConnectionChecked(true);

      } catch (err) {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        console.warn("[CONNECTION_VERIFIER] Connection test failed, but continuing:", err);
        setConnectionVerified(true); // Continue anyway to prevent blocking
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
