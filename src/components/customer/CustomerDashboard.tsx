import React from "react";
import { useClientProfile } from "@/hooks/useClientProfile";
import { useClientDashboardStats } from "@/hooks/useClientDashboardStats";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { useClientAuth } from "@/hooks/useClientAuth";

// Import the components
import { WelcomeSection } from "./dashboard/WelcomeSection";
import { PackageSummaryCard } from "./dashboard/PackageSummaryCard";
import { SubmissionsStatusOverview } from "./dashboard/SubmissionsStatusOverview";
import { QuickActions } from "./dashboard/QuickActions";

export function CustomerDashboard() {
  const { user } = useCustomerAuth();
  const { clientId, hasLinkedClientRecord } = useClientAuth();
  const { clientProfile, loading: profileLoading, error: profileError } = useClientProfile(user?.id);
  const { statusCounts, loading: statsLoading, error: statsError } = useClientDashboardStats(clientProfile?.client_id);

  const isLoading = profileLoading || statsLoading;

  // Handle the case where user is authenticated but no client record is linked
  if (!hasLinkedClientRecord && !isLoading) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-800">אין פרופיל לקוח מקושר</AlertTitle>
        <AlertDescription className="text-amber-700">
          החשבון שלך מאומת, אך אינו מקושר לפרופיל לקוח במערכת. 
          אנא צור קשר עם התמיכה לסיוע בהשלמת תהליך הרישום.
        </AlertDescription>
      </Alert>
    );
  }

  // Check if there are any submissions with count > 0
  const hasSubmissions = React.useMemo(() => {
    if (!statusCounts) return false;
    return statusCounts.some(item => item.count > 0);
  }, [statusCounts]);

  // Debug logging in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[CustomerDashboard] Debug:', {
        clientId,
        hasLinkedClientRecord,
        clientProfile: {
          clientId: clientProfile?.client_id,
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
  }, [clientProfile, profileLoading, profileError, statusCounts, statsLoading, statsError, hasSubmissions, clientId, hasLinkedClientRecord]);

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
