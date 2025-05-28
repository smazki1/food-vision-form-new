
import React from 'react';

interface FormErrorDisplayProps {
  stepErrors: Record<string, string>;
}

const FormErrorDisplay: React.FC<FormErrorDisplayProps> = ({ stepErrors }) => {
  if (Object.keys(stepErrors).length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-sm font-semibold text-red-700 mb-1 text-center">שגיאות:</h3>
      <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
        {Object.entries(stepErrors).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ul>
    </div>
  );
};

export default FormErrorDisplay;
