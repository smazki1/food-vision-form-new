
import React, { useState, useEffect, ReactNode } from 'react';
import { useCustomerAuth } from '@/hooks/useCustomerAuth';
import { useQuery } from "@tanstack/react-query";
import { fetchClientId } from "@/utils/clientAuthUtils";
import { ClientAuthContextType } from '@/types/clientAuthTypes';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ClientAuthProviderProps {
  children: ReactNode;
}

export const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  const { user, loading: authLoading, isAuthenticated, initialized } = useCustomerAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(true);
  const [clientDataLoading, setClientDataLoading] = useState(false);
  const [clientQueryEnabled, setClientQueryEnabled] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [clientRecordStatus, setClientRecordStatus] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading');
  const [hasNoClientRecord, setHasNoClientRecord] = useState<boolean>(false);
  const [connectionVerified, setConnectionVerified] = useState<boolean>(false);

  // Test Supabase connection on mount
  useEffect(() => {
    console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Testing Supabase connection");
    
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('clients').select('count').limit(1);
        console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Connection test result:", { 
          success: !error, 
          error: error?.message,
          code: error?.code,
          data
        });
        
        if (error) {
          setErrorState(`Database connection error: ${error.message}`);
          setConnectionVerified(false);
        } else {
          setConnectionVerified(true);
          setErrorState(null);
        }
      } catch (err) {
        console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Connection test exception:", err);
        setConnectionVerified(false);
        setErrorState(`Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    
    testConnection();
  }, []);

  // Enable the client data query only when auth is complete and user is authenticated
  useEffect(() => {
    if (initialized && !authLoading && isAuthenticated && user?.id && connectionVerified) {
      setClientQueryEnabled(true);
      setClientDataLoading(true);
      setClientRecordStatus('loading');
      console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Enabling client data query for user:", user.id);
    } else if (initialized && !authLoading && !isAuthenticated) {
      // If auth is initialized and user is not authenticated, we can stop authenticating
      setClientId(null);
      setAuthenticating(false);
      setClientDataLoading(false);
      setClientQueryEnabled(false);
      setClientRecordStatus('not-found');
      setHasNoClientRecord(true);
      setErrorState(null);
      console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - User not authenticated, resetting client auth state");
    } else {
      console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Not ready to fetch client data yet:", {
        initialized,
        authLoading,
        isAuthenticated,
        hasUserId: !!user?.id,
        connectionVerified
      });
    }
  }, [initialized, authLoading, isAuthenticated, user?.id, connectionVerified]);

  // Use React Query with improved error handling and retry logic
  const { data: clientData, isLoading: clientQueryLoading, error: clientError } = useQuery({
    queryKey: ["clientId", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - No user ID for query");
        return null;
      }
      
      console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Fetching client ID for user:", user.id);
      const startTime = Date.now();
      
      try {
        const result = await fetchClientId(user.id);
        const duration = Date.now() - startTime;
        console.log(`[AUTH_DEBUG_FINAL_] ClientAuthProvider - fetchClientId completed in ${duration}ms with result:`, result);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[AUTH_DEBUG_FINAL_] ClientAuthProvider - fetchClientId failed after ${duration}ms:`, error);
        
        // Capture specific policy errors for UI feedback
        if (error instanceof Error) {
          if (error.message.includes('policy')) {
            setErrorState("Database policy error detected. Please contact support.");
          }
          else if (error.message.includes('permission')) {
            setErrorState("Permission denied. Please check your account permissions.");
          }
          else if (error.message.includes('Authentication')) {
            setErrorState("Authentication verification failed. Please try logging in again.");
          }
        }
        throw error;
      }
    },
    enabled: clientQueryEnabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      // If it's a policy error, don't retry
      if (error instanceof Error && 
         (error.message.includes('policy') || 
          error.message.includes('permission') ||
          error.message.includes('Authentication') ||
          error.message.includes('recursion'))) {
        console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Auth/permission error, not retrying");
        return false;
      }
      // Otherwise retry up to 2 times
      return failureCount < 2;
    },
    meta: {
      onError: (error: Error) => {
        console.error("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Error fetching client data:", error);
        setClientDataLoading(false);
        setClientRecordStatus('error');
        
        // Set specific error states for different error types
        if (error.message.includes('policy') || error.message.includes('recursion')) {
          setErrorState("Policy configuration error. Please contact support.");
        } else if (error.message.includes('permission')) {
          setErrorState("Permission denied. Please check your account permissions.");
        } else if (error.message.includes('Authentication')) {
          setErrorState("Authentication verification failed. Please try logging in again.");
        } else {
          setErrorState("Error loading client data. Please try again later.");
        }
      }
    }
  });

  // Handle client data loading state
  useEffect(() => {
    if (clientQueryEnabled && !clientQueryLoading) {
      setClientDataLoading(false);
    }
  }, [clientQueryLoading, clientQueryEnabled]);

  // Update client state when data is available
  useEffect(() => {
    // Debug state changes
    console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Auth state:", { 
      userId: user?.id, 
      authLoading,
      clientQueryLoading,
      clientDataLoading,
      clientData,
      clientError,
      initialized,
      isAuthenticated,
      errorState,
      clientRecordStatus,
      connectionVerified
    });
    
    if (initialized && !authLoading) {
      // Auth is complete
      if (isAuthenticated) {
        // User is authenticated, set client data if available
        if (!clientQueryLoading && clientData !== undefined) {
          console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Setting clientId:", clientData);
          
          // Handle client record status based on clientData
          if (clientData === null) {
            setClientRecordStatus('not-found');
            setHasNoClientRecord(true);
            console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - No client record linked to user");
          } else {
            setClientRecordStatus('found');
            setHasNoClientRecord(false);
            console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Client record found");
          }
          
          setClientId(clientData); // Could be null if no client record exists
          setAuthenticating(false);
        }
      } else {
        // Not authenticated, reset client data
        setClientId(null);
        setAuthenticating(false);
        setErrorState(null);
        setClientRecordStatus('not-found');
        setHasNoClientRecord(true);
      }
    }
  }, [
    user, 
    authLoading, 
    clientData, 
    clientQueryLoading, 
    initialized, 
    isAuthenticated, 
    clientError,
    connectionVerified
  ]);

  // The final context value with clearer states
  const contextValue: ClientAuthContextType = {
    clientId, 
    authenticating: authenticating || authLoading || clientDataLoading,
    isAuthenticated,
    hasLinkedClientRecord: !!clientId, // Explicit flag for linked client record
    hasNoClientRecord, // NEW: Explicit flag for confirmed no client record
    clientRecordStatus, // NEW: Status indicator
    errorState // Add error state to context for UI feedback
  };

  console.log("[AUTH_DEBUG_FINAL_] ClientAuthProvider - Final context state:", contextValue);

  return (
    <ClientAuthContext.Provider value={contextValue}>
      {children}
    </ClientAuthContext.Provider>
  );
};
