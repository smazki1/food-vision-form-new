
import React from "react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientDashboardStats } from "@/hooks/useClientDashboardStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useClientAuth } from "@/hooks/useClientAuth";
import { Button } from "@/components/ui/button";

// Import the components
import { WelcomeSection } from "./dashboard/WelcomeSection";
import { PackageSummaryCard } from "./dashboard/PackageSummaryCard";
import { SubmissionsStatusOverview } from "./dashboard/SubmissionsStatusOverview";
import { QuickActions } from "./dashboard/QuickActions";

export function CustomerDashboard() {
  const { user } = useUnifiedAuth();
  const { clientId, hasLinkedClientRecord, clientRecordStatus, errorState, refreshClientAuth } = useClientAuth();
  const { clientProfile, loading: profileLoading, error: profileError } = useClientProfile(user?.id);
  const { statusCounts, loading: statsLoading, error: statsError } = useClientDashboardStats(clientProfile?.client_id);

  const isLoading = profileLoading || statsLoading;

  // Show retry option for timeout errors
  if (errorState && errorState.includes('timed out')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
        <Alert className="bg-amber-50 border-amber-200 max-w-md">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">טעינה איטית</AlertTitle>
          <AlertDescription className="text-amber-700">
            הטעינה לוקחת יותר זמן מהרגיל. אנא נסו לרענן.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={refreshClientAuth}
          className="w-full max-w-xs"
        >
          רענן את הדף
        </Button>
        <Button 
          variant="outline"
          onClick={() => window.location.reload()}
          className="w-full max-w-xs"
        >
          טען מחדש
        </Button>
      </div>
    );
  }

  // Handle the case where user is authenticated but no client record is linked
  if (clientRecordStatus === 'not-found' && !isLoading) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-800">אין פרופיל לקוח מקושר</AlertTitle>
        <AlertDescription className="text-amber-700">
          החשבון שלכם מאומת, אך אינו מקושר לפרופיל לקוח במערכת.
          אנא צרו קשר עם התמיכה לסיוע בהשלמת תהליך הרישום.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle error state
  if (errorState && !isLoading && !errorState.includes('timed out')) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת פרופיל לקוח</AlertTitle>
        <AlertDescription>
          {errorState}
        </AlertDescription>
      </Alert>
    );
  }

  // Check if there are any submissions with count > 0
  const hasSubmissions = React.useMemo(() => {
    if (!statusCounts) return false;
    return statusCounts.some(item => item.count > 0);
  }, [statusCounts]);

  // Handle errors with more detail
  if (profileError || statsError) {
    const error = profileError || statsError;
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת הנתונים</AlertTitle>
        <AlertDescription>
          <div>
            {typeof error === 'string' ? error : error?.message || "אירעה שגיאה בטעינת הנתונים"}
          </div>
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
          לא נמצא פרופיל לקוח. אנא התחברו מחדש או צרו קשר עם התמיכה.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      {/* Welcome message */}
      <WelcomeSection clientProfile={clientProfile} />

      {/* Package Summary */}
      <PackageSummaryCard clientProfile={clientProfile} />

      {/* Submissions Status Overview */}
      <SubmissionsStatusOverview 
        statusCounts={statusCounts}
        hasSubmissions={hasSubmissions}
        clientId={clientProfile.client_id}
        profileError={profileError}
        statsError={statsError}
        isLoading={isLoading}
      />

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
