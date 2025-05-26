interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  error: Error;
  context: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
  metadata?: Record<string, any>;
}

class PerformanceMonitoringService {
  private metrics: PerformanceMetric[] = [];
  private errors: ErrorReport[] = [];
  private debugMode: boolean = false;
  private maxMetrics = 1000;
  private maxErrors = 500;

  constructor() {
    this.debugMode = localStorage.getItem('debug-mode') === 'true';
    this.setupGlobalErrorHandler();
  }

  setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    localStorage.setItem('debug-mode', enabled.toString());
    console.log(`[PERFORMANCE] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  getDebugMode(): boolean {
    return this.debugMode;
  }

  startTiming(name: string): () => void {
    const startTime = performance.now();
    
    if (this.debugMode) {
      console.log(`[PERFORMANCE] Starting timer: ${name}`);
    }

    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration);
      
      if (this.debugMode) {
        console.log(`[PERFORMANCE] ${name}: ${duration.toFixed(2)}ms`);
      }
    };
  }

  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    if (this.debugMode) {
      console.log(`[PERFORMANCE] Metric recorded:`, metric);
    }
  }

  recordError(error: Error, context: string, metadata?: Record<string, any>) {
    const errorReport: ErrorReport = {
      error,
      context,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata
    };

    this.errors.push(errorReport);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    if (this.debugMode) {
      console.error(`[PERFORMANCE] Error recorded:`, errorReport);
    }
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getAverageMetric(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  getMetricsSummary() {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {};
    
    this.metrics.forEach(metric => {
      if (!summary[metric.name]) {
        summary[metric.name] = { count: 0, average: 0, min: Infinity, max: -Infinity };
      }
      
      const s = summary[metric.name];
      s.count++;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
    });

    // Calculate averages
    Object.keys(summary).forEach(name => {
      summary[name].average = this.getAverageMetric(name);
    });

    return summary;
  }

  clearMetrics() {
    this.metrics = [];
    if (this.debugMode) {
      console.log(`[PERFORMANCE] Metrics cleared`);
    }
  }

  clearErrors() {
    this.errors = [];
    if (this.debugMode) {
      console.log(`[PERFORMANCE] Errors cleared`);
    }
  }

  private setupGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
      this.recordError(
        new Error(event.message),
        'Global Error Handler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      );
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError(
        new Error(event.reason?.toString() || 'Unhandled Promise Rejection'),
        'Unhandled Promise Rejection'
      );
    });
  }

  exportData() {
    return {
      metrics: this.metrics,
      errors: this.errors,
      summary: this.getMetricsSummary(),
      timestamp: Date.now()
    };
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();
