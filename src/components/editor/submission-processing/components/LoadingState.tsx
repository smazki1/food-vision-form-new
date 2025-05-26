
import React from "react";
import { SmartLoading } from "@/components/ui/smart-loading";
import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";

interface LoadingStateProps {
  message?: string;
  showSkeleton?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "טוען פרטי הגשה...",
  showSkeleton = true,
  error,
  onRetry
}) => {
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center">
        <SmartLoading
          isLoading={false}
          error={error}
          onRetry={onRetry}
          message="שגיאה בטעינת פרטי ההגשה"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {showSkeleton ? (
        <div className="space-y-6">
          <ProgressiveSkeleton variant="card" lines={2} showImage={false} />
          <ProgressiveSkeleton variant="form" lines={3} />
          <ProgressiveSkeleton variant="list" lines={4} showAvatar={true} />
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <SmartLoading
            isLoading={true}
            message={message}
            phases={['initial', 'fetching', 'processing']}
            showProgress={true}
            size="lg"
          />
        </div>
      )}
    </div>
  );
};

export default LoadingState;
