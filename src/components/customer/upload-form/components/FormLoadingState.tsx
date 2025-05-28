
import React from 'react';

interface FormLoadingStateProps {
  currentLoadingTime: number;
}

const FormLoadingState: React.FC<FormLoadingStateProps> = ({ currentLoadingTime }) => {
  return (
    <div className="flex justify-center items-center h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-4 text-lg mt-4">טוען פרטי משתמש... ({currentLoadingTime}s)</p>
        {currentLoadingTime > 3 && (
          <p className="text-sm text-muted-foreground mt-2">
            הטעינה לוקחת יותר זמן מהצפוי...
          </p>
        )}
      </div>
    </div>
  );
};

export default FormLoadingState;
