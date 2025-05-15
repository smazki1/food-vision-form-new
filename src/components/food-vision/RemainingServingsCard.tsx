
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RemainingServingsCardProps {
  remainingServings: number;
  loading?: boolean;
}

const RemainingServingsCard: React.FC<RemainingServingsCardProps> = ({
  remainingServings,
  loading = false
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }

  const hasServings = remainingServings > 0;

  return (
    <Card className={hasServings ? "" : "border-red-300 bg-red-50"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">מנות נותרות בחבילה</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <Badge 
            variant={hasServings ? "secondary" : "destructive"} 
            className="text-lg w-fit px-3 py-1"
          >
            {remainingServings}
          </Badge>
          
          {!hasServings && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                נגמרו לך המנות בחבילה. אנא שדרג את החבילה או פנה לתמיכה להוספת מנות.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemainingServingsCard;
