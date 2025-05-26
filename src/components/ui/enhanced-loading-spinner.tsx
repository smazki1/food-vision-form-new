
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'retrying';

interface EnhancedLoadingSpinnerProps {
  state?: LoadingState;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const EnhancedLoadingSpinner = ({ 
  state = 'loading',
  size = 'md', 
  message,
  error,
  onRetry,
  className,
  showProgress = false,
  progress = 0
}: EnhancedLoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const getIcon = () => {
    switch (state) {
      case 'loading':
        return <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />;
      case 'retrying':
        return <RefreshCw className={cn(sizeClasses[size], 'animate-spin text-orange-500')} />;
      case 'success':
        return <CheckCircle2 className={cn(sizeClasses[size], 'text-green-500')} />;
      case 'error':
        return <AlertCircle className={cn(sizeClasses[size], 'text-red-500')} />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (error && state === 'error') return error;
    if (message) return message;
    
    switch (state) {
      case 'loading':
        return 'טוען...';
      case 'retrying':
        return 'מנסה שוב...';
      case 'success':
        return 'הושלם בהצלחה';
      case 'error':
        return 'אירעה שגיאה';
      default:
        return '';
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="flex items-center gap-2">
        {getIcon()}
        {getMessage() && (
          <span className={cn('text-muted-foreground', textSizeClasses[size])}>
            {getMessage()}
          </span>
        )}
      </div>
      
      {showProgress && state === 'loading' && (
        <div className="w-full max-w-xs bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {state === 'error' && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-primary hover:text-primary/80 underline mt-1"
        >
          נסה שוב
        </button>
      )}
    </div>
  );
};
