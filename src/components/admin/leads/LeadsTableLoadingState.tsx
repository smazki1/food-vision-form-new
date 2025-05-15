
import React from "react";

export const LeadsTableLoadingState: React.FC = () => {
  return (
    <div className="space-y-2">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="h-16 w-full bg-muted/30 rounded-md animate-pulse" />
      ))}
    </div>
  );
};
