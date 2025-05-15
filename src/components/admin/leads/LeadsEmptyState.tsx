
import React from "react";

export const LeadsEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-center text-lg text-muted-foreground">
        לא נמצאו לידים
      </p>
      <p className="text-center text-muted-foreground">
        הוסף ליד חדש כדי להתחיל
      </p>
    </div>
  );
};
