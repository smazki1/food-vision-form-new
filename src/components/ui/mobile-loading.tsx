import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface MobileLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MobileLoading: React.FC<MobileLoadingProps> = ({ 
  message = "טוען...", 
  size = 'md',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center p-6 space-y-3",
        "min-h-[200px] w-full",
        className
      )}
      {...props}
    >
      <Loader2 className={cn(
        "animate-spin text-primary",
        sizeClasses[size]
      )} />
      <p className={cn(
        "text-muted-foreground text-center",
        textClasses[size]
      )}>
        {message}
      </p>
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <div className="w-full h-full bg-primary animate-pulse rounded-full" />
      </div>
    </div>
  );
};
