
import React from "react";
import { SmartLoading } from "@/components/ui/smart-loading";

interface FormProgressMessageProps {
  message: string | null;
  isError?: boolean;
  onRetry?: () => void;
  showSpinner?: boolean;
}

const FormProgressMessage: React.FC<FormProgressMessageProps> = ({ 
  message, 
  isError = false,
  onRetry,
  showSpinner = true
}) => {
  if (!message) return null;

  if (isError) {
    return (
      <div className="w-full flex justify-center mb-2">
        <SmartLoading
          isLoading={false}
          error={new Error(message)}
          onRetry={onRetry}
          size="sm"
          className="bg-red-50 border border-red-300 rounded p-3"
        />
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mb-2 w-full text-center text-yellow-900 text-base font-medium shadow-sm transition-all">
      <div className="flex items-center justify-center gap-2">
        {showSpinner && (
          <SmartLoading
            isLoading={true}
            message=""
            size="sm"
            showProgress={false}
            className="flex-shrink-0"
          />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default FormProgressMessage;
