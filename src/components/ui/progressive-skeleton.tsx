
import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface ProgressiveSkeletonProps {
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
  animate?: boolean;
  className?: string;
  variant?: 'card' | 'list' | 'table' | 'form';
}

export const ProgressiveSkeleton: React.FC<ProgressiveSkeletonProps> = ({
  lines = 3,
  showAvatar = false,
  showImage = false,
  animate = true,
  className,
  variant = 'card'
}) => {
  const baseClass = animate ? 'animate-pulse' : '';

  const renderCardVariant = () => (
    <div className={cn('space-y-4 p-4 border rounded-lg', baseClass, className)}>
      {showImage && <Skeleton className="h-48 w-full rounded" />}
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton 
            key={i} 
            className={cn(
              'h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )} 
          />
        ))}
      </div>
    </div>
  );

  const renderListVariant = () => (
    <div className={cn('space-y-3', baseClass, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          {showAvatar && <Skeleton className="h-8 w-8 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableVariant = () => (
    <div className={cn('space-y-2', baseClass, className)}>
      <Skeleton className="h-10 w-full" /> {/* Header */}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );

  const renderFormVariant = () => (
    <div className={cn('space-y-4', baseClass, className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-1/4" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
    </div>
  );

  switch (variant) {
    case 'list':
      return renderListVariant();
    case 'table':
      return renderTableVariant();
    case 'form':
      return renderFormVariant();
    default:
      return renderCardVariant();
  }
};
