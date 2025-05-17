import React from "react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientDashboardStats } from "@/hooks/useClientDashboardStats";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Package, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const statusTranslations: Record<string, { text: string, variant: string }> = {
  "ממתינה לעיבוד": { text: "ממתינות לעיבוד", variant: "yellow" },
  "בעיבוד": { text: "בעיבוד", variant: "blue" },
  "מוכנה להצגה": { text: "מוכנות להצגה", variant: "purple" },
  "הערות התקבלו": { text: "ממתינות לתיקונים", variant: "warning" },
  "הושלמה ואושרה": { text: "הושלמו ואושרו", variant: "green" }
};

export function CustomerDashboard() {
  const { clientProfile, loading: profileLoading, error: profileError } = useClientProfile();
  const { statusCounts, loading: statsLoading, error: statsError } = useClientDashboardStats(clientProfile?.client_id);

  const isLoading = profileLoading || statsLoading;

  // Check if there are any submissions with count > 0
  const hasSubmissions = React.useMemo(() => {
    if (!statusCounts) return false;
    return statusCounts.some(item => item.count > 0);
  }, [statusCounts]);

  // Debug logging in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[CustomerDashboard] Debug:', {
        clientProfile: {
          clientId: clientProfile?.client_id,
          userAuthId: clientProfile?.user_auth_id,
          restaurantName: clientProfile?.restaurant_name,
          remainingServings: clientProfile?.remaining_servings,
          currentPackageId: clientProfile?.current_package_id
        },
        profileLoading,
        profileError,
        statusCounts,
        statsLoading,
        statsError,
        hasSubmissions
      });
    }
  }, [clientProfile, profileLoading, profileError, statusCounts, statsLoading, statsError, hasSubmissions]);

  // Handle errors with more detail
  if (profileError || statsError) {
    const error = profileError || statsError;
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת הנתונים</AlertTitle>
        <AlertDescription>
          <div>
            {error?.message || "אירעה שגיאה בטעינת הנתונים"}
          </div>
          {process.env.NODE_ENV === 'development' && error && (
            <pre className="mt-2 text-xs">
              {JSON.stringify(error, null, 2)}
            </pre>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          לא נמצא פרופיל לקוח. אנא התחבר מחדש או צור קשר עם התמיכה.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Package Summary */}
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
                    {(clientProfile as any)?.service_packages?.package_name || "חבילה נוכחית"}
                  </>
                ) : (
                  "אין חבילה פעילה"
                )}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clientProfile?.remaining_servings} מנות נותרו מתוך{" "}
                {(clientProfile as any)?.service_packages?.total_servings || "-"}
              </p>
            </div>
            <Button asChild>
              <Link to="/upgrade-package">
                שדרג חבילה
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          {clientProfile?.remaining_servings && clientProfile.remaining_servings < 5 && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
              <p className="text-amber-700 text-sm">
                נותרו לך {clientProfile.remaining_servings} מנות בלבד! שקול לרכוש מנות נוספות כדי להמשיך להשתמש בשירות.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">סטטוס מנות</CardTitle>
          <CardDescription>סקירת מספר המנות לפי סטטוס</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statusCounts.map((item) => {
                const statusInfo = statusTranslations[item.status] || { text: item.status, variant: "default" };
                return (
                  <Link 
                    key={item.status} 
                    to={`/customer/submissions?status=${encodeURIComponent(item.status)}`}
                    className="group"
                  >
                    <Card className="transition-all group-hover:border-primary">
                      <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
                        <Badge variant={statusInfo.variant as any}>
                          {statusInfo.text}
                        </Badge>
                        <p className="text-3xl font-bold">{item.count}</p>
                        <p className="text-sm text-muted-foreground text-center">לחץ לצפייה</p>
                      </CardContent>
                    </Card>
                  </Link>
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
                    clientId: clientProfile?.client_id,
                    userAuthId: clientProfile?.user_auth_id,
                    statusCounts,
                    isLoading,
                    hasError: !!profileError || !!statsError,
                    hasSubmissions
                  }, null, 2)}
                </pre>
              )}
              <Button className="mt-4" asChild>
                <Link to="/food-vision-form">העלה מנות עכשיו</Link>
              </Button>
            </div>
          )}

          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link to="/customer/submissions">
                צפה בכל המנות
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
