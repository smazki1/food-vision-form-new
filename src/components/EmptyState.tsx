
import React from "react";
import { ClipboardList } from "lucide-react";

interface EmptyStateProps {
  message?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = "No tasks found" 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-muted/30 rounded-full p-6 mb-4">
        <ClipboardList className="h-12 w-12 text-muted-foreground/70" />
      </div>
      <h3 className="text-lg font-medium mb-2">It's empty here</h3>
      <p className="text-muted-foreground max-w-sm">{message}</p>
    </div>
  );
};

export default EmptyState;
