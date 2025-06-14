import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface FormErrorSummaryProps {
  errors: Record<string, string>;
  onDismiss?: () => void;
}

const FormErrorSummary: React.FC<FormErrorSummaryProps> = ({ errors, onDismiss }) => {
  const errorEntries = Object.entries(errors);
  
  if (errorEntries.length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 relative" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-800 font-semibold text-sm mb-2">
            יש לתקן את השגיאות הבאות כדי להמשיך:
          </h3>
          <ul className="text-red-700 text-sm space-y-1">
            {errorEntries.map(([key, message]) => (
              <li key={key} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></span>
                {message}
              </li>
            ))}
          </ul>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors p-1"
            aria-label="סגור הודעת שגיאה"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FormErrorSummary; 