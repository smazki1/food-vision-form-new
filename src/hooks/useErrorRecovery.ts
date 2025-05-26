
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UseErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  backoffMultiplier?: number;
  onError?: (error: Error, attemptNumber: number) => void;
  onRetry?: (attemptNumber: number) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

export function useErrorRecovery({
  maxRetries = 3,
  retryDelay = 1000,
  backoffMultiplier = 1.5,
  onError,
  onRetry,
  onMaxRetriesReached
}: UseErrorRecoveryOptions = {}) {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>,
    customMaxRetries?: number
  ): Promise<T> => {
    const effectiveMaxRetries = customMaxRetries ?? maxRetries;
    
    try {
      const result = await operation();
      clearError();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      console.error(`[ERROR_RECOVERY] Attempt ${retryCount + 1} failed:`, error);
      onError?.(error, retryCount + 1);

      if (retryCount < effectiveMaxRetries) {
        setIsRetrying(true);
        const delay = retryDelay * Math.pow(backoffMultiplier, retryCount);
        
        console.log(`[ERROR_RECOVERY] Retrying in ${delay}ms... (${retryCount + 1}/${effectiveMaxRetries})`);
        
        return new Promise((resolve, reject) => {
          timeoutRef.current = setTimeout(async () => {
            try {
              setRetryCount(prev => prev + 1);
              onRetry?.(retryCount + 1);
              const result = await executeWithRecovery(operation, effectiveMaxRetries);
              setIsRetrying(false);
              resolve(result);
            } catch (retryError) {
              setIsRetrying(false);
              reject(retryError);
            }
          }, delay);
        });
      } else {
        console.error(`[ERROR_RECOVERY] Max retries (${effectiveMaxRetries}) reached`);
        onMaxRetriesReached?.(error);
        toast.error(`פעולה נכשלה לאחר ${effectiveMaxRetries} נסיונות: ${error.message}`);
        throw error;
      }
    }
  }, [retryCount, maxRetries, retryDelay, backoffMultiplier, onError, onRetry, onMaxRetriesReached, clearError]);

  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    setError(null);
    setRetryCount(0);
    setIsRetrying(false);
    return executeWithRecovery(operation);
  }, [executeWithRecovery]);

  return {
    error,
    isRetrying,
    retryCount,
    maxRetries,
    executeWithRecovery,
    retry,
    clearError,
    hasReachedMaxRetries: retryCount >= maxRetries
  };
}
