
import { useCallback, useEffect, useRef } from 'react';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';

interface UsePerformanceMonitoringOptions {
  componentName?: string;
  trackRenders?: boolean;
  trackMounts?: boolean;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    componentName = 'Unknown Component',
    trackRenders = false,
    trackMounts = true
  } = options;

  const renderCount = useRef(0);
  const mountTime = useRef<number>();

  // Track component mount
  useEffect(() => {
    if (trackMounts) {
      mountTime.current = performance.now();
      const stopTiming = performanceMonitoringService.startTiming(`${componentName} Mount`);
      
      return () => {
        stopTiming();
        if (mountTime.current) {
          const mountDuration = performance.now() - mountTime.current;
          performanceMonitoringService.recordMetric(
            `${componentName} Lifetime`,
            mountDuration,
            { renderCount: renderCount.current }
          );
        }
      };
    }
  }, [componentName, trackMounts]);

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current++;
      performanceMonitoringService.recordMetric(
        `${componentName} Render`,
        renderCount.current
      );
    }
  });

  const startTiming = useCallback((operationName: string) => {
    return performanceMonitoringService.startTiming(`${componentName} - ${operationName}`);
  }, [componentName]);

  const recordMetric = useCallback((name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitoringService.recordMetric(`${componentName} - ${name}`, value, metadata);
  }, [componentName]);

  const recordError = useCallback((error: Error, context: string, metadata?: Record<string, any>) => {
    performanceMonitoringService.recordError(error, `${componentName} - ${context}`, metadata);
  }, [componentName]);

  return {
    startTiming,
    recordMetric,
    recordError,
    renderCount: renderCount.current
  };
}
