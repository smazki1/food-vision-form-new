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

export const CustomerDashboard: React.FC = () => {
  console.log('[CustomerDashboard] RENDERING - current path:', window.location.pathname);
  
  const { 
    clientId: unifiedClientId,
    user,
    role 
  } = useUnifiedAuth();
  
  // Redirect admin users to admin dashboard
  if (role === 'admin') {
    console.log('[CustomerDashboard] Admin user detected - redirecting to admin dashboard');
    window.location.href = '/admin';
    return null;
  }

  const { clientId, hasLinkedClientRecord, clientRecordStatus, errorState, refreshClientAuth } = useClientAuth();
  const { clientProfile, loading: profileLoading, error: profileError } = useClientProfile(user?.id);
  const { statusCounts, loading: statsLoading, error: statsError } = useClientDashboardStats(clientProfile?.client_id);

  const isLoading = profileLoading || statsLoading;

  // Check if there are any submissions with count > 0
  const hasSubmissions = React.useMemo(() => {
    if (!statusCounts) return false;
    return statusCounts.some(item => item.count > 0);
  }, [statusCounts]);

  console.log("[CUSTOMER_DASHBOARD] State:", {
    clientId,
    hasLinkedClientRecord,
    clientRecordStatus,
    errorState,
    isLoading,
    profileError,
    statsError
  });

  // Handle error states with simplified retry
  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
        <Alert className="bg-red-50 border-red-200 max-w-md">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-800">שגיאה בטעינת הנתונים</AlertTitle>
          <AlertDescription className="text-red-700">
            {errorState}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={refreshClientAuth}
          className="w-full max-w-xs"
        >
          נסה שוב
        </Button>
      </div>
    );
  }

  // Handle the case where user is authenticated but no client record is linked
  if (clientRecordStatus === 'not-found' && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
        <Alert className="bg-amber-50 border-amber-200 max-w-md">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">אין פרופיל לקוח מקושר</AlertTitle>
          <AlertDescription className="text-amber-700">
            החשבון שלכם מאומת, אך אינו מקושר לפרופיל לקוח במערכת.
            אנא צרו קשר עם התמיכה לסיוע בהשלמת תהליך הרישום.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={refreshClientAuth}
          variant="outline"
          className="w-full max-w-xs"
        >
          רענן
        </Button>
      </div>
    );
  }

  // Handle other errors
  if (profileError || statsError) {
    const error = profileError || statsError;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>שגיאה בטעינת הנתונים</AlertTitle>
          <AlertDescription>
            {typeof error === 'string' ? error : error?.message || "אירעה שגיאה בטעינת הנתונים"}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full max-w-xs"
        >
          טען מחדש
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!clientProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 space-y-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            לא נמצא פרופיל לקוח. אנא התחברו מחדש או צרו קשר עם התמיכה.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={refreshClientAuth}
          className="w-full max-w-xs"
        >
          נסה שוב
        </Button>
      </div>
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
