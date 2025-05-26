import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { StatusCard } from "./StatusCard";

export type StatusCount = {
  status: string;
  count: number;
};

interface SubmissionsStatusOverviewProps {
  statusCounts: StatusCount[];
  hasSubmissions: boolean;
  clientId?: string;
  profileError?: any;
  statsError?: any;
  isLoading: boolean;
}

const statusTranslations: Record<string, { text: string, variant: string }> = {
  "ממתינה לעיבוד": { text: "ממתינות לעיבוד", variant: "yellow" },
  "בעיבוד": { text: "בעיבוד", variant: "blue" },
  "מוכנה להצגה": { text: "מוכנות להצגה", variant: "purple" },
  "הערות התקבלו": { text: "ממתינות לתיקונים", variant: "warning" },
  "הושלמה ואושרה": { text: "הושלמו ואושרו", variant: "green" }
};

export const SubmissionsStatusOverview: React.FC<SubmissionsStatusOverviewProps> = ({
  statusCounts,
  hasSubmissions,
  clientId,
  profileError,
  statsError,
  isLoading
}) => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-3 text-center">
        <CardTitle className="text-2xl">סטטוס מנות</CardTitle>
        <CardDescription>סקירת מספר המנות לפי סטטוס</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasSubmissions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statusCounts.map((item) => {
              const statusInfo = statusTranslations[item.status] || { text: item.status, variant: "default" };
              return (
                <StatusCard 
                  key={item.status}
                  status={item.status}
                  count={item.count}
                  variant={statusInfo.variant}
                  displayText={statusInfo.text}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין מנות שהועלו עדיין</p>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-2 text-xs text-left">
                Debug Info:
                {JSON.stringify({
                  clientId,
                  statusCounts,
                  isLoading,
                  hasError: !!profileError || !!statsError,
                  hasSubmissions
                }, null, 2)}
              </pre>
            )}
            <Button className="mt-4" asChild>
              <Link to="/food-vision-form">העלו מנות עכשיו</Link>
            </Button>
          </div>
        )}

        <div className="flex justify-center">
          <Button variant="outline" asChild>
            <Link to="/customer/submissions">
              צפו בכל המנות
              <ArrowRight className="mr-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
