
import React from "react";

interface OriginalImagesSectionProps {
  originalItemId?: string;
  itemType?: string;
}

const OriginalImagesSection: React.FC<OriginalImagesSectionProps> = ({
  originalItemId,
  itemType,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">תמונות מקוריות</h3>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {originalItemId && 
         itemType === "dish" ? (
          <div className="space-y-2">
            <p>תמונות מקוריות של מנה #{originalItemId}</p>
          </div>
        ) : originalItemId && 
           itemType === "cocktail" ? (
          <div className="space-y-2">
            <p>תמונות מקוריות של קוקטייל #{originalItemId}</p>
          </div>
        ) : originalItemId && 
           itemType === "drink" ? (
          <div className="space-y-2">
            <p>תמונות מקוריות של משקה #{originalItemId}</p>
          </div>
        ) : (
          <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
            <p className="text-muted-foreground">אין תמונה מקורית</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OriginalImagesSection;
