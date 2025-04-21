
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdditionalDetailsTabContentProps {
  additionalDetails: {
    visual_style: string;
    brand_colors: string;
    general_notes: string;
    branding_materials_url: string;
  } | null;
}

export const AdditionalDetailsTabContent: React.FC<AdditionalDetailsTabContentProps> = ({ 
  additionalDetails 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>פרטים נוספים</CardTitle>
      </CardHeader>
      <CardContent>
        {additionalDetails ? (
          <div className="space-y-4">
            {additionalDetails.visual_style && (
              <div>
                <h4 className="font-semibold mb-1">סגנון חזותי:</h4>
                <p>{additionalDetails.visual_style}</p>
              </div>
            )}
            
            {additionalDetails.brand_colors && (
              <div>
                <h4 className="font-semibold mb-1">צבעי מותג:</h4>
                <p>{additionalDetails.brand_colors}</p>
              </div>
            )}
            
            {additionalDetails.general_notes && (
              <div>
                <h4 className="font-semibold mb-1">הערות כלליות:</h4>
                <p>{additionalDetails.general_notes}</p>
              </div>
            )}
            
            {additionalDetails.branding_materials_url && (
              <div>
                <h4 className="font-semibold mb-1">חומרי מיתוג:</h4>
                <a 
                  href={additionalDetails.branding_materials_url} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  הצג חומרי מיתוג
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            לא נוספו פרטים נוספים
          </div>
        )}
      </CardContent>
    </Card>
  );
};
