
import { useErrorRecovery } from './useErrorRecovery';
import { useProgressiveLoading, LoadingPhase } from './useProgressiveLoading';
import { usePerformanceMonitoring } from './usePerformanceMonitoring';
import { useEffect } from 'react';

interface UseSmartQueryOptions {
  phases?: LoadingPhase[];
  maxRetries?: number;
  autoRetry?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  componentName?: string;
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
    onSuccess,
    componentName = 'SmartQuery'
  } = options;

  const { recordError, recordMetric, startTiming } = usePerformanceMonitoring({
    componentName,
    trackMounts: true
  });

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
    onError: (error, attemptNumber) => {
      recordError(error, `Query Error (Attempt ${attemptNumber})`);
      onError?.(error);
    },
    onMaxRetriesReached: (error) => {
      console.error('[SMART_QUERY] Max retries reached:', error);
      recordError(error, 'Max Retries Reached');
      onError?.(error);
    }
  });

  // Handle query state changes with performance tracking
  useEffect(() => {
    if (queryResult.error) {
      goToPhase('error');
      recordError(queryResult.error, 'Query Failed');
      if (autoRetry && queryResult.refetch) {
        const stopTiming = startTiming('Auto Retry');
        executeWithRecovery(async () => {
          await queryResult.refetch?.();
        }).finally(() => {
          stopTiming();
        });
      }
    } else if (queryResult.isLoading) {
      if (currentPhase === 'initial' || currentPhase === 'error') {
        goToPhase('fetching');
      }
    } else if (queryResult.data) {
      goToPhase('complete');
      recordMetric('Query Success', 1);
      onSuccess?.();
    }
  }, [queryResult.isLoading, queryResult.error, queryResult.data, goToPhase, currentPhase, autoRetry, executeWithRecovery, queryResult.refetch, onSuccess, recordError, recordMetric, startTiming]);

  const handleRetry = async () => {
    if (queryResult.refetch) {
      reset();
      const stopTiming = startTiming('Manual Retry');
      try {
        await retry(async () => {
          await queryResult.refetch?.();
        });
      } finally {
        stopTiming();
      }
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
