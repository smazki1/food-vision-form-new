import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
// import { Link } from "react-router-dom"; // No longer needed for the list items directly
import { useClients_Simplified_V2 } from "@/hooks/useClients"; 
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClientListItemCard } from "@/components/admin/clients/ClientListItemCard"; // Import the new card component
import { RefreshCw, Search, AlertTriangle } from "lucide-react"; // Icons for refresh and search input

// Basic placeholder for AdminContentLayout - can be replaced with actual layout if it exists
const AdminContentLayout = ({ children }: { children: React.ReactNode }) => <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>;

export function ClientsList() {
  const { t } = useTranslation();
  const currentUserRoleData = useCurrentUserRole();

  useEffect(() => {
    // console.log('[ClientsList] currentUserRoleData updated:', JSON.stringify(currentUserRoleData, null, 2));
  }, [currentUserRoleData]);

  const [searchTerm, setSearchTerm] = useState("");

  const isClientsQueryEnabled = 
    currentUserRoleData.status === "ROLE_DETERMINED" && 
    (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager);

  useEffect(() => {
    // console.log(`[ClientsList] Calculated isClientsQueryEnabled: ${isClientsQueryEnabled}, current status: ${currentUserRoleData.status}, isAdmin: ${currentUserRoleData.isAdmin}, userId: ${currentUserRoleData.userId}`);
  }, [isClientsQueryEnabled, currentUserRoleData.status, currentUserRoleData.isAdmin, currentUserRoleData.userId]);

  const {
    clients,
    isLoading: isClientsLoading,
    error: clientsError,
    refreshClients,
    queryStatus: clientsQueryStatus,
    isFetching: isClientsFetching
  } = useClients_Simplified_V2({
    enabled: isClientsQueryEnabled,
    userId: currentUserRoleData.userId
  });

  useEffect(() => {
    // console.log(`[ClientsList] useClients_Simplified_V2 state: isLoading=${isClientsLoading}, isFetching=${isClientsFetching}, queryStatus=${clientsQueryStatus}, error=${clientsError?.message}, clientsCount=${clients.length}`);
  }, [isClientsLoading, isClientsFetching, clientsQueryStatus, clientsError, clients]);

  const filteredClients = clients.filter(client => {
    if (!client) return false; // Ensure client object exists
    const searchTermLower = searchTerm.toLowerCase();
    return (
      client.restaurant_name?.toLowerCase().includes(searchTermLower) ||
      client.contact_name?.toLowerCase().includes(searchTermLower) ||
      client.email?.toLowerCase().includes(searchTermLower) ||
      client.phone?.toLowerCase().includes(searchTermLower)
    );
  });

  const handleRefresh = () => {
    // console.log("[ClientsList] Manual refresh triggered.");
    refreshClients(); 
  };
  
  if (currentUserRoleData.status !== "ROLE_DETERMINED") {
    let message = t("common.loading");
    if (currentUserRoleData.status === "ERROR_FETCHING_ROLE" || currentUserRoleData.status === "ERROR_SESSION") {
      message = currentUserRoleData.error || t("common.authorizationError");
    } else if (currentUserRoleData.status === "NO_SESSION"){
      message = t("common.unauthorized"); 
    }
    return (
      <AdminContentLayout>
        <div className="text-center py-10">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t("clientsList.pageTitle", "ניהול לקוחות")}</h1>
            <div>{message}</div>
        </div>
      </AdminContentLayout>
    );
  }

  if (!isClientsQueryEnabled) {
     return (
      <AdminContentLayout>
         <div className="text-center py-10">
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t("clientsList.pageTitle", "ניהול לקוחות")}</h1>
            <div>{t("common.unauthorized")}</div>
        </div>
      </AdminContentLayout>
    );
  }

  return (
    <AdminContentLayout>
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">{t("clientsList.pageTitle", "ניהול לקוחות")}</h1>
      
      <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
                placeholder={t("clientsList.searchPlaceholder", "Search by name, contact, email...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rtl:pr-10 w-full"
            />
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={isClientsFetching || isClientsLoading} className="flex items-center gap-2 whitespace-nowrap w-full md:w-auto">
            <RefreshCw className={`h-4 w-4 ${isClientsFetching ? 'animate-spin' : ''}`} />
            {isClientsFetching ? t("common.refreshing", "מרענן...") : t("common.refresh", "רענן")}
        </Button>
      </div>

      {(isClientsLoading || isClientsFetching) && clientsQueryStatus !== 'success' && (
        <div className="text-center py-10" data-testid="clients-list-loader">
          <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin mb-4" />
          <p className="text-lg text-gray-600">{t("common.loadingData", "טוען נתונים...")}</p>
        </div>
      )}

      {clientsError && (
        <div className="text-center py-10 bg-red-50 p-6 rounded-lg border border-red-200">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-lg text-red-700 mb-2">{t("clientsList.errorLoading", "שגיאה בטעינת הלקוחות")}</p>
            <p className="text-sm text-red-600 mb-4">{clientsError.message}</p>
            <Button onClick={handleRefresh} variant="destructive" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {t("common.retry", "נסה שוב")}
            </Button>
        </div>
      )}

      {clientsQueryStatus === 'success' && !isClientsFetching && !clientsError && (
        <>
          <p className="text-md text-gray-600 mb-4">
            {t("clientsList.clientsFoundCount", "לקוחות שנמצאו")}: {filteredClients.length}
          </p>
          {filteredClients.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
              <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm 
                    ? t("clientsList.noResultsFoundForSearch", { searchTerm, defaultValue: `לא נמצאו תוצאות עבור "${searchTerm}"` })
                    : t("clientsList.noClientsFound", "לא נמצאו לקוחות")
                }
              </p>
              <p className="text-gray-500">
                {searchTerm 
                    ? t("clientsList.tryDifferentSearch", "נסה מונח חיפוש אחר או הרחב את הסינון.")
                    : t("clientsList.noClientsDescription", "עדיין אין לקוחות במערכת או שהם אינם תואמים לסינון הנוכחי.")
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClients.map(client => (
                client && <ClientListItemCard key={client.client_id} client={client} />
              ))}
            </div>
          )}
        </>
      )}
    </AdminContentLayout>
  );
}
