import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useClients_Simplified_V2 } from "@/hooks/useClients"; 
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ClientListItemCard } from "@/components/admin/clients/ClientListItemCard";
import { MobileLoading } from "@/components/ui/mobile-loading";
import { RefreshCw, Search, AlertTriangle } from "lucide-react";

// Basic placeholder for AdminContentLayout
const AdminContentLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="p-2 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
);

const ClientsList = () => {
  const { t } = useTranslation();
  const currentUserRoleData = useCurrentUserRole();
  const [searchTerm, setSearchTerm] = useState("");

  const isClientsQueryEnabled = 
    currentUserRoleData.status === "ROLE_DETERMINED" && 
    (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager);

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

  const filteredClients = clients.filter(client => {
    if (!client) return false;
    const searchTermLower = searchTerm.toLowerCase();
    return (
      client.restaurant_name?.toLowerCase().includes(searchTermLower) ||
      client.contact_name?.toLowerCase().includes(searchTermLower) ||
      client.email?.toLowerCase().includes(searchTermLower) ||
      client.phone?.toLowerCase().includes(searchTermLower)
    );
  });

  const handleRefresh = () => {
    refreshClients(); 
  };
  
  // Show mobile-optimized loading for role determination
  if (currentUserRoleData.status !== "ROLE_DETERMINED") {
    let message = t("common.loading");
    if (currentUserRoleData.status === "ERROR_FETCHING_ROLE" || currentUserRoleData.status === "ERROR_SESSION") {
      message = currentUserRoleData.error || t("common.authorizationError");
    } else if (currentUserRoleData.status === "NO_SESSION"){
      message = t("common.unauthorized"); 
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

  if (!isClientsQueryEnabled) {
     return (
      <AdminContentLayout>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
          {t("clientsList.pageTitle", "ניהול לקוחות")}
        </h1>
        <MobileLoading message={t("common.unauthorized")} size="lg" />
      </AdminContentLayout>
    );
  }

  return (
    <AdminContentLayout>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-gray-800">
        {t("clientsList.pageTitle", "ניהול לקוחות")}
      </h1>
      
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <Input
            placeholder={t("clientsList.searchPlaceholder", "Search by name, contact, email...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 sm:pl-10 rtl:pr-9 sm:rtl:pr-10 w-full text-sm sm:text-base"
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

      {(isClientsLoading || isClientsFetching) && clientsQueryStatus !== 'success' && (
        <MobileLoading 
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
    </AdminContentLayout>
  );
};

export default ClientsList;
