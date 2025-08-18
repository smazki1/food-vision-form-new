import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useClients_Simplified_V2 } from "@/hooks/useClients"; 
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClientListItemCard } from "@/components/admin/clients/ClientListItemCard";
import { MobileLoading } from "@/components/ui/mobile-loading";
import { NewClientDialog } from "@/components/admin/clients/NewClientDialog";
import { RefreshCw, Search, AlertTriangle, UserPlus, Archive, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

// Basic placeholder for AdminContentLayout
const AdminContentLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
);

const ClientsList = () => {
  const { t } = useTranslation();
  const currentUserRoleData = useCurrentUserRole();
  // Initialize search term from URL query if provided, else empty. Avoid auto-filling.
  const [searchTerm, setSearchTerm] = useState("");

  // On mount, ensure no leftover search term from previous navigation
  useEffect(() => {
    setSearchTerm("");
  }, []);
  const [showArchived, setShowArchived] = useState(false);
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);

  // Enhanced logic to handle authentication fallback scenarios with more stability
  const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
  const testAdminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  // Determine if we have admin access - be more permissive to avoid flickering
  const hasAdminAccess = (
    currentUserRoleData.status === "ROLE_DETERMINED" && 
    (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager)
  ) || (
    // Enhanced fallback - if we have localStorage admin, allow access even if role isn't fully determined
    adminAuth && (
      currentUserRoleData.status === "FORCED_COMPLETE" || 
      currentUserRoleData.status === "ERROR_FETCHING_ROLE" ||
      currentUserRoleData.status === "ERROR_SESSION" ||
      currentUserRoleData.status === "FETCHING_ROLE" ||
      currentUserRoleData.status === "CHECKING_SESSION"
    )
  );

  // For the userId, use a stable approach that doesn't flicker
  const effectiveUserId = currentUserRoleData.userId || (adminAuth ? testAdminId : null);
  
  // Make the query enabled as long as we have admin access, regardless of userId state
  const isQueryEnabled = hasAdminAccess && (effectiveUserId !== null);

  console.log('[ClientsList] Auth state:', {
    status: currentUserRoleData.status,
    isAdmin: currentUserRoleData.isAdmin,
    userId: currentUserRoleData.userId,
    adminAuth,
    hasAdminAccess,
    effectiveUserId,
    isQueryEnabled
  });

  const {
    clients,
    isLoading: isClientsLoading,
    error: clientsError,
    refreshClients,
    queryStatus: clientsQueryStatus,
    isFetching: isClientsFetching
  } = useClients_Simplified_V2({
    enabled: isQueryEnabled,
    userId: effectiveUserId
  });

  const filteredClients = clients.filter(client => {
    if (!client) return false;
    
    // Filter by archive status
    const isArchived = client.client_status === 'ארכיון';
    if (showArchived && !isArchived) return false;
    if (!showArchived && isArchived) return false;
    
    // Filter by search term
    const searchTermLower = searchTerm.toLowerCase();
    return (
      client.restaurant_name?.toLowerCase().includes(searchTermLower) ||
      client.contact_name?.toLowerCase().includes(searchTermLower) ||
      client.email?.toLowerCase().includes(searchTermLower) ||
      client.phone?.toLowerCase().includes(searchTermLower)
    );
  });

  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.client_status !== 'ארכיון').length;
  const archivedClients = clients.filter(c => c.client_status === 'ארכיון').length;

  const handleRefresh = () => {
    refreshClients(); 
  };
  
  // Show loading if we're still determining authentication or if we don't have admin access yet
  if (!hasAdminAccess) {
    let message = t("common.loading");
    
    if (currentUserRoleData.status === "ERROR_FETCHING_ROLE" || currentUserRoleData.status === "ERROR_SESSION") {
      message = currentUserRoleData.error || t("common.authorizationError");
    } else if (currentUserRoleData.status === "NO_SESSION") {
      message = t("common.unauthorized"); 
    } else if (adminAuth && (
      currentUserRoleData.status === "CHECKING_SESSION" || 
      currentUserRoleData.status === "FETCHING_ROLE" ||
      currentUserRoleData.status === "INITIALIZING"
    )) {
      message = "מאמת גישת אדמין...";
    }
    
    return (
      <AdminContentLayout>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          {t("clientsList.pageTitle", "ניהול לקוחות")}
        </h1>
        <MobileLoading message={message} size="lg" />
      </AdminContentLayout>
    );
  }

  return (
    <AdminContentLayout>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
        {t("clientsList.pageTitle", "ניהול לקוחות")}
      </h1>
      
      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
          <div className="text-sm text-blue-700">סה״כ לקוחות</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{activeClients}</div>
          <div className="text-sm text-green-700">לקוחות פעילים</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-600">{archivedClients}</div>
          <div className="text-sm text-gray-700">בארכיון</div>
        </div>
      </div>
 
      {/* Controls */}
      <div className="mb-4 sm:mb-6 space-y-3">
        {/* Top row - search and refresh */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <Input
              placeholder={t("clientsList.searchPlaceholder", "Search by name, contact, email...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 sm:pl-10 rtl:pr-9 sm:rtl:pr-10 w-full text-sm sm:text-base"
              type="search"
              name="clients-search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              inputMode="search"
              spellCheck={false}
            />
          </div>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            disabled={isClientsFetching || isClientsLoading} 
            className="flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto py-2 px-3"
          >
            <RefreshCw className={`h-4 w-4 ${isClientsFetching ? 'animate-spin' : ''}`} />
            <span className="text-sm sm:text-base">
              {isClientsFetching ? t("common.refreshing", "מרענן...") : t("common.refresh", "רענן")}
            </span>
          </Button>
        </div>

        {/* Bottom row - action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowArchived(false)}
              variant={!showArchived ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              לקוחות פעילים
              <Badge variant="secondary" className="ml-2">
                {activeClients}
              </Badge>
            </Button>
            <Button
              onClick={() => setShowArchived(true)}
              variant={showArchived ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              ארכיון
              <Badge variant="secondary" className="ml-2">
                {archivedClients}
              </Badge>
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="flex items-center gap-2"
            >
              <Link to="/admin/clients/costs-report">
                <DollarSign className="h-4 w-4" />
                דוח עלויות
              </Link>
            </Button>
            <Button
              onClick={() => setShowNewClientDialog(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4" />
              הוסף לקוח חדש
            </Button>
          </div>
        </div>
      </div>

      {(isClientsLoading || isClientsFetching) && clientsQueryStatus !== 'success' && (
        <MobileLoading 
          data-testid="clients-list-loader"
          message={t("common.loadingData", "טוען נתונים...")} 
          size="lg"
          className="min-h-[300px]"
        />
      )}

      {clientsError && (
        <div className="text-center py-6 sm:py-10 bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
          <AlertTriangle className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-red-500 mb-3 sm:mb-4" />
          <p className="text-base sm:text-lg text-red-700 mb-2">
            {t("clientsList.errorLoading", "שגיאה בטעינת הלקוחות")}
          </p>
          <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">{clientsError.message}</p>
          <Button onClick={handleRefresh} variant="destructive" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t("common.retry", "נסה שוב")}
          </Button>
        </div>
      )}

      {clientsQueryStatus === 'success' && !isClientsFetching && !clientsError && (
        <>
          <p className="text-sm sm:text-md text-gray-600 mb-3 sm:mb-4">
            {t("clientsList.clientsFoundCount", "לקוחות שנמצאו")}: {filteredClients.length}
          </p>
          {filteredClients.length === 0 ? (
            <div className="text-center py-6 sm:py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <Search className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
              <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                {searchTerm 
                  ? t("clientsList.noResultsFoundForSearch", { searchTerm, defaultValue: `לא נמצאו תוצאות עבור "${searchTerm}"` })
                  : t("clientsList.noClientsFound", "לא נמצאו לקוחות")
                }
              </p>
              <p className="text-sm sm:text-base text-gray-500 px-4">
                {searchTerm 
                  ? t("clientsList.tryDifferentSearch", "נסה מונח חיפוש אחר או הרחב את הסינון.")
                  : t("clientsList.noClientsDescription", "עדיין אין לקוחות במערכת או שהם אינם תואמים לסינון הנוכחי.")
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredClients.map(client => (
                client && <ClientListItemCard key={client.client_id} client={client} />
              ))}
            </div>
          )}
        </>
      )}

      {/* New Client Dialog */}
      <NewClientDialog 
        open={showNewClientDialog} 
        onOpenChange={setShowNewClientDialog} 
      />
    </AdminContentLayout>
  );
};

export default ClientsList;
