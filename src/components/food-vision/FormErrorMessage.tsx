
import React from "react";
import { AlertTriangle } from "lucide-react";

interface FormErrorMessageProps {
  error: string | null;
}

const FormErrorMessage: React.FC<FormErrorMessageProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div 
      id="form-error-message"
      className="bg-red-50 border-2 border-red-300 text-red-800 p-4 rounded-lg mb-6 animate-pulse flex items-center gap-3"
    >
      <AlertTriangle className="h-5 w-5 text-red-500" />
      <span className="font-medium">{error}</span>
    </div>
  );
};

export default FormErrorMessage;
