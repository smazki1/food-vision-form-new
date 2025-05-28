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

    // This logic will only run if connectionChecked is initially false or explicitly reset.
    // To force a check on mount, initialize connectionChecked to false.
    // Currently, it starts as true, so this hook won't auto-run unless connectionChecked is changed elsewhere.
    
    // If we decide this should always run on mount regardless of initial state, 
    // then `connectionChecked` should be initialized to `false`.
    // For now, keeping the logic that it runs if `connectionChecked` is false.

    if (connectionChecked) { // If already checked (or assuming checked), don't re-run automatically.
        // console.log("[CONNECTION_VERIFIER] Connection already checked or assumed. Skipping auto-run.");
        return;
    }

    // console.log("[CONNECTION_VERIFIER] Performing connection test as connectionChecked is false.");
    timeoutId = setTimeout(() => {
      if (isMounted && !connectionChecked) { // Check connectionChecked again inside timeout
        // console.warn("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection check timed out after 2s");
        setConnectionVerified(false);
        onConnectionErrorRef.current("Database connection check timed out. Please check your internet connection.");
        setConnectionChecked(true);
      }
    }, 2000); // 2 second timeout
    
    const testConnection = async () => {
      try {
        const { success, error: connError } = await clientAuthService.testDatabaseConnection();
        if (!isMounted) return;
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        // console.log(`[CONNECTION_VERIFIER] Connection test completed in ${duration}ms`);
        
        if (connError) {
          onConnectionErrorRef.current(`Database connection error: ${connError.message}`);
          setConnectionVerified(false);
        } else if (success) { 
          setConnectionVerified(true);
          onConnectionErrorRef.current(''); 
        } else {
          onConnectionErrorRef.current('Database connection test was inconclusive.');
          setConnectionVerified(false);
        }
        setConnectionChecked(true);

      } catch (err) {
        if (!isMounted) return;
        clearTimeout(timeoutId);
        // console.warn("[CONNECTION_VERIFIER] Connection test failed due to exception:", err);
        setConnectionVerified(false); 
        onConnectionErrorRef.current(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setConnectionChecked(true); // Kept from HEAD
      }
    };
    
    testConnection(); // Called because connectionChecked was false
    
    return performCleanup;
  }, [connectionChecked]); // Rerun if connectionChecked state changes (e.g. to force a re-check)

  // Function to manually trigger a re-check if needed by external components
  const forceRecheckConnection = () => {
    // console.log("[CONNECTION_VERIFIER] Forcing re-check of connection.");
    setConnectionChecked(false); // This will trigger the useEffect above
  };

  return { connectionVerified, forceRecheckConnection }; // Return object for more flexibility
};
