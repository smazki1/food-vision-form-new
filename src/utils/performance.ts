// Performance monitoring utilities
import React from 'react';

interface PerformanceMetrics {
  componentName: string;
  loadTime: number;
  timestamp: number;
  bundleSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private loadStartTimes: Map<string, number> = new Map();

  // Start timing a component load
  startTiming(componentName: string): void {
    this.loadStartTimes.set(componentName, performance.now());
  }

  // End timing and record metrics
  endTiming(componentName: string): void {
    const startTime = this.loadStartTimes.get(componentName);
    if (startTime) {
      const loadTime = performance.now() - startTime;
      this.metrics.push({
        componentName,
        loadTime,
        timestamp: Date.now()
      });
      this.loadStartTimes.delete(componentName);
      
      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      }
    }
  }

  // Get performance metrics
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  // Get average load time for a component
  getAverageLoadTime(componentName: string): number {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, m) => sum + m.loadTime, 0);
    return totalTime / componentMetrics.length;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics = [];
    this.loadStartTimes.clear();
  }

  // Export metrics for analysis
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// HOC for measuring component load times
export function withPerformanceTracking<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
): React.ComponentType<T> {
  return function PerformanceTrackedComponent(props: T) {
    React.useEffect(() => {
      performanceMonitor.startTiming(componentName);
      return () => {
        performanceMonitor.endTiming(componentName);
      };
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}

// Hook for measuring render performance
export function usePerformanceTracking(componentName: string): void {
  React.useEffect(() => {
    performanceMonitor.startTiming(componentName);
    return () => {
      performanceMonitor.endTiming(componentName);
    };
  }, [componentName]);
}

// Utility to measure bundle size impact
export function measureBundleSize(): void {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      console.log(`📦 Total bundle load time: ${loadTime.toFixed(2)}ms`);
      
      // Measure resource sizes
      const resources = performance.getEntriesByType('resource');
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const totalJSSize = jsResources.reduce((sum, r) => sum + (r as any).transferSize || 0, 0);
      
      console.log(`📊 Total JS bundle size: ${(totalJSSize / 1024).toFixed(2)}KB`);
    });
  }
}

// Performance optimization recommendations
export function getPerformanceRecommendations(): string[] {
  const recommendations: string[] = [];
  const metrics = performanceMonitor.getMetrics();
  
  // Check for slow loading components
  const slowComponents = metrics.filter(m => m.loadTime > 1000);
  if (slowComponents.length > 0) {
    recommendations.push(
      `Consider lazy loading for slow components: ${slowComponents.map(c => c.componentName).join(', ')}`
    );
  }
  
  // Check for frequently loaded components
  const componentCounts = metrics.reduce((acc, m) => {
    acc[m.componentName] = (acc[m.componentName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const frequentComponents = Object.entries(componentCounts)
    .filter(([, count]) => count > 10)
    .map(([name]) => name);
    
  if (frequentComponents.length > 0) {
    recommendations.push(
      `Consider preloading frequently used components: ${frequentComponents.join(', ')}`
    );
  }
  
  return recommendations;
} 