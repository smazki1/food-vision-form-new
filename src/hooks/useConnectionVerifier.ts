
import { useState, useEffect } from 'react';
import { clientAuthService } from '@/services/clientAuthService';

/**
 * Hook to verify database connection
 */
export const useConnectionVerifier = (
  onConnectionError: (error: string) => void
) => {
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);

  // Test database connection on mount
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL] useConnectionVerifier - Testing database connection");
    
    const testConnection = async () => {
      try {
        const { success, error } = await clientAuthService.testDatabaseConnection();
        
        if (error) {
          onConnectionError(`Database connection error: ${error.message}`);
          setConnectionVerified(false);
        } else {
          setConnectionVerified(true);
          onConnectionError('');
        }
      } catch (err) {
        console.error("[AUTH_DEBUG_FINAL] useConnectionVerifier - Connection test exception:", err);
        setConnectionVerified(false);
        onConnectionError(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    
    testConnection();
  }, [onConnectionError]);

  return connectionVerified;
};
