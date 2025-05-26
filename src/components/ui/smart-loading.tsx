
import React from 'react';
import { EnhancedLoadingSpinner, LoadingState } from './enhanced-loading-spinner';
import { useProgressiveLoading, LoadingPhase } from '@/hooks/useProgressiveLoading';
import { useErrorRecovery } from '@/hooks/useErrorRecovery';

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
  maxRetries = 3
}) => {
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
      await executeWithRecovery(async () => {
        await onRetry();
      });
    }
  };

  // Update phase based on loading state
  React.useEffect(() => {
    if (error) {
      goToPhase('error');
    } else if (!isLoading && effectivePhase !== 'complete') {
      goToPhase('complete');
    } else if (isLoading && effectivePhase === 'initial') {
      goToPhase('fetching');
    }
  }, [isLoading, error, effectivePhase, goToPhase]);

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
