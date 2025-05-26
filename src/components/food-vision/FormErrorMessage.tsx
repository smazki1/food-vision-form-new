
import React from "react";
import { AlertTriangle } from "lucide-react";
import { SmartLoading } from "@/components/ui/smart-loading";

interface FormErrorMessageProps {
  error: string | null;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ 
  error, 
  onRetry,
  showRetryButton = true 
}) => {
  if (!error) return null;

  return (
    <div 
      id="form-error-message"
      className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3"
    >
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">{error}</span>
        {showRetryButton && onRetry && (
          <div className="mt-2">
            <SmartLoading
              isLoading={false}
              error={new Error(error)}
              onRetry={onRetry}
              size="sm"
              className="inline-flex"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FormErrorMessage;
