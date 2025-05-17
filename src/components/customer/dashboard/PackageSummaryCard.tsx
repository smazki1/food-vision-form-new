
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
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl">חבילה נוכחית</CardTitle>
        <CardDescription>פרטי החבילה הנוכחית שלך ומספר המנות שנותרו</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center justify-between">
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
          <Button asChild>
            <Link to="/customer/profile">
              צפה בפרטי החבילה
              <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        {clientProfile?.remaining_servings && clientProfile.remaining_servings < 5 && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
            <p className="text-amber-700 text-sm">
              נותרו לך {clientProfile.remaining_servings} מנות בלבד! צור קשר איתנו לרכישת מנות נוספות.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
