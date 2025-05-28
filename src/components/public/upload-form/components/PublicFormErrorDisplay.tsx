
import React from 'react';

interface PublicFormErrorDisplayProps {
  errors: Record<string, string>;
}

const PublicFormErrorDisplay: React.FC<PublicFormErrorDisplayProps> = ({ errors }) => {
  if (Object.keys(errors).length === 0) return null;

  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <h3 className="text-sm font-semibold text-red-700">אנא תקנו את השגיאות הבאות:</h3>
      <ul className="list-disc list-inside text-sm text-red-600 mt-1">
        {Object.entries(errors).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ul>
    </div>
  );
};

export default PublicFormErrorDisplay;
