
import React, { Component, ReactNode } from 'react';
import { performanceMonitoringService } from '@/services/performanceMonitoringService';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  private errorId: string = '';

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Record error in performance monitoring
    performanceMonitoringService.recordError(
      error,
      this.props.context || 'React Error Boundary',
      {
        errorId: this.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    );

    // Call optional onError callback
    this.props.onError?.(error, errorInfo);

    this.setState({ errorId: this.errorId });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            שגיאה בטעינת הרכיב
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
          </p>
          {performanceMonitoringService.getDebugMode() && (
            <div className="text-xs text-gray-500 mb-4 font-mono">
              Error ID: {this.state.errorId}
              <br />
              {this.state.error?.message}
            </div>
          )}
          <Button onClick={this.handleRetry} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
