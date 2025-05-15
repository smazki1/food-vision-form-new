
import React, { ReactNode } from "react";
import { ClipboardList } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "It's empty here",
  description,
  message,
  action,
  icon = <ClipboardList className="h-12 w-12 text-muted-foreground/70" />
}) => {
  // If message is provided but description isn't, use message for description
  const displayDescription = description || message || "No items found";

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-muted/30 rounded-full p-6 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{displayDescription}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
