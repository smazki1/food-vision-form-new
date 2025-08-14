import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Package, ArrowRight } from "lucide-react";
import { Client } from "@/types/client";

interface PackageSummaryCardProps {
  clientProfile: Client | null;
}

export const PackageSummaryCard: React.FC<PackageSummaryCardProps> = ({ clientProfile }) => {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-2xl">חבילה נוכחית</CardTitle>
        <CardDescription>פרטי החבילה הנוכחית שלכם/ן ומספר המנות שנותרו</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="space-y-1">
            <h3 className="text-xl font-medium">
              {clientProfile?.current_package_id ? (
                <>
                  <Package className="inline-block mr-2 h-5 w-5" />
                  {clientProfile?.service_packages?.package_name || "חבילה נוכחית"}
                </>
              ) : (
                "אין חבילה פעילה"
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {clientProfile?.remaining_servings} מנות נותרו מתוך{" "}
              {clientProfile?.service_packages?.total_servings || "-"}
            </p>
          </div>
          {/* Requested: hide the "view package details" button */}
        </div>
        
        {clientProfile?.remaining_servings && clientProfile.remaining_servings < 5 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-center">
            <p className="text-amber-700 text-sm">
              נותרו לכם/ן {clientProfile.remaining_servings} מנות בלבד! צרו קשר איתנו לרכישת מנות נוספות.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
