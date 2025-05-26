
import React from "react";
import { SmartLoading } from "@/components/ui/smart-loading";
import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";

interface PackagesLoadingStateProps {
  error?: Error | null;
  onRetry?: () => void;
  variant?: 'skeleton' | 'spinner';
}

const PackagesLoadingState: React.FC<PackagesLoadingStateProps> = ({ 
  error,
  onRetry,
  variant = 'spinner'
}) => {
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <SmartLoading
          isLoading={false}
          error={error}
          onRetry={onRetry}
          message="שגיאה בטעינת החבילות"
          size="lg"
        />
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ProgressiveSkeleton key={i} variant="card" lines={3} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-64">
      <SmartLoading
        isLoading={true}
        message="טוען חבילות שירות..."
        phases={['initial', 'fetching', 'processing']}
        showProgress={true}
      />
    </div>
  );
};

export default PackagesLoadingState;
