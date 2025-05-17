
import React from "react";

const LoadingState: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded"></div>
        <div className="h-48 bg-muted rounded"></div>
      </div>
    </div>
  );
};

export default LoadingState;
