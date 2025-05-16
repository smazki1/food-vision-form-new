
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ImageQualityGuideProps {
  hasProcessedImages: boolean;
}

const ImageQualityGuide: React.FC<ImageQualityGuideProps> = ({ 
  hasProcessedImages 
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">איכות תמונות</h3>
      {hasProcessedImages ? (
        <div className="space-y-2">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              נא לוודא שהתמונות המעובדות עומדות בדרישות האיכות הבאות:
              <ul className="list-disc list-inside mt-2">
                <li>רזולוציה מינימלית: 1080x1080 פיקסלים</li>
                <li>פורמט: JPG או PNG</li>
                <li>יחס גובה-רוחב: מרובע או אורכי</li>
                <li>התמונה ממוקדת וברורה</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <p className="text-muted-foreground">אין תמונות מעובדות לבדיקה</p>
      )}
    </div>
  );
};

export default ImageQualityGuide;
