
import React from "react";
import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";
import { SmartLoading } from "@/components/ui/smart-loading";

interface LeadsTableLoadingStateProps {
  error?: Error | null;
  onRetry?: () => void;
  variant?: 'skeleton' | 'spinner';
}

export const LeadsTableLoadingState: React.FC<LeadsTableLoadingStateProps> = ({ 
  error,
  onRetry,
  variant = 'skeleton'
}) => {
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <SmartLoading
          isLoading={false}
          error={error}
          onRetry={onRetry}
          message="שגיאה בטעינת הלידים"
          size="lg"
        />
      </div>
    );
  }

  if (variant === 'spinner') {
    return (
      <div className="flex justify-center items-center h-64">
        <SmartLoading
          isLoading={true}
          message="טוען לידים..."
          phases={['initial', 'authenticating', 'fetching']}
          showProgress={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ProgressiveSkeleton variant="table" lines={5} />
    </div>
  );
};
