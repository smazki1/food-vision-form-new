
import React from 'react';
import { EnhancedLoadingSpinner, LoadingState } from './enhanced-loading-spinner';
import { useProgressiveLoading, LoadingPhase } from '@/hooks/useProgressiveLoading';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface SmartLoadingProps {
  isLoading: boolean;
  error?: Error | null;
  onRetry?: () => Promise<void> | void;
  phases?: LoadingPhase[];
  currentPhase?: LoadingPhase;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
  maxRetries?: number;
  componentName?: string;
}

export const SmartLoading: React.FC<SmartLoadingProps> = ({
  isLoading,
  error,
  onRetry,
  phases = ['initial', 'fetching', 'complete'],
  currentPhase,
  message,
  size = 'md',
  showProgress = true,
  className,
  maxRetries = 3,
  componentName = 'SmartLoading'
}) => {
  const { recordError, startTiming } = usePerformanceMonitoring({
    componentName,
    trackMounts: true
  });

  const {
    currentPhase: progressivePhase,
    progress,
    message: progressiveMessage,
    goToPhase
  } = useProgressiveLoading({
    phases,
    autoAdvance: false
  });

  const {
    isRetrying,
    retryCount,
    executeWithRecovery
  } = useErrorRecovery({
    maxRetries,
    onRetry: () => {
      goToPhase('fetching');
    },
    onError: (error) => {
      recordError(error, 'Error Recovery');
    }
  });

  const effectivePhase = currentPhase || progressivePhase;
  const effectiveMessage = message || progressiveMessage;

  const getLoadingState = (): LoadingState => {
    if (error) return 'error';
    if (isRetrying) return 'retrying';
    if (isLoading) return 'loading';
    if (effectivePhase === 'complete') return 'success';
    return 'loading';
  };

  const handleRetry = async () => {
    if (onRetry) {
      const stopTiming = startTiming('Retry Operation');
      try {
        await executeWithRecovery(async () => {
          await onRetry();
        });
      } catch (error) {
        recordError(error as Error, 'Retry Failed');
      } finally {
        stopTiming();
      }
    }
  };

  // Update phase based on loading state
  React.useEffect(() => {
    if (error) {
      goToPhase('error');
      recordError(error, 'Loading Error');
    } else if (!isLoading && effectivePhase !== 'complete') {
      goToPhase('complete');
    } else if (isLoading && effectivePhase === 'initial') {
      goToPhase('fetching');
    }
  }, [isLoading, error, effectivePhase, goToPhase, recordError]);

  return (
    <EnhancedLoadingSpinner
      state={getLoadingState()}
      size={size}
      message={effectiveMessage}
      error={error?.message}
      onRetry={handleRetry}
      className={className}
      showProgress={showProgress}
      progress={progress}
    />
  );
};
