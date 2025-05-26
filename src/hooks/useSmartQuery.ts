
import { useErrorRecovery } from './useErrorRecovery';
import { useProgressiveLoading, LoadingPhase } from './useProgressiveLoading';
import { useEffect } from 'react';

interface UseSmartQueryOptions {
  phases?: LoadingPhase[];
  maxRetries?: number;
  autoRetry?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

export function useSmartQuery<T>(
  queryResult: {
    data?: T;
    isLoading: boolean;
    error?: Error | null;
    refetch?: () => void;
  },
  options: UseSmartQueryOptions = {}
) {
  const {
    phases = ['initial', 'authenticating', 'fetching', 'complete'],
    maxRetries = 3,
    autoRetry = false,
    onError,
    onSuccess
  } = options;

  const {
    currentPhase,
    progress,
    message,
    goToPhase,
    reset
  } = useProgressiveLoading({
    phases,
    autoAdvance: false
  });

  const {
    error: recoveryError,
    isRetrying,
    executeWithRecovery,
    retry
  } = useErrorRecovery({
    maxRetries,
    onError,
    onMaxRetriesReached: (error) => {
      console.error('[SMART_QUERY] Max retries reached:', error);
      onError?.(error);
    }
  });

  // Handle query state changes
  useEffect(() => {
    if (queryResult.error) {
      goToPhase('error');
      if (autoRetry && queryResult.refetch) {
        executeWithRecovery(async () => {
          await queryResult.refetch?.();
        });
      }
    } else if (queryResult.isLoading) {
      if (currentPhase === 'initial' || currentPhase === 'error') {
        goToPhase('fetching');
      }
    } else if (queryResult.data) {
      goToPhase('complete');
      onSuccess?.();
    }
  }, [queryResult.isLoading, queryResult.error, queryResult.data, goToPhase, currentPhase, autoRetry, executeWithRecovery, queryResult.refetch, onSuccess]);

  const handleRetry = async () => {
    if (queryResult.refetch) {
      reset();
      await retry(async () => {
        await queryResult.refetch?.();
      });
    }
  };

  return {
    // Original query data
    ...queryResult,
    
    // Enhanced loading state
    currentPhase,
    progress,
    message,
    isRetrying,
    
    // Error recovery
    enhancedError: recoveryError || queryResult.error,
    handleRetry,
    
    // Utilities
    reset,
    goToPhase
  };
}
