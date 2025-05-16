
import React from "react";

interface FormProgressMessageProps {
  message: string | null;
}

const FormProgressMessage: React.FC<FormProgressMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mb-2 w-full text-center text-yellow-900 text-base font-medium shadow-sm transition-all">
      {message}
    </div>
  );
};

export default FormProgressMessage;
