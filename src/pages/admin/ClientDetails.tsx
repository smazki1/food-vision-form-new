import React from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientHeader } from "@/components/admin/client-details/ClientHeader";
import { ClientInfo } from "@/components/admin/client-details/ClientInfo";
import { DishesTabContent } from "@/components/admin/client-details/tabs/DishesTabContent";
import { CocktailsTabContent } from "@/components/admin/client-details/tabs/CocktailsTabContent";
import { DrinksTabContent } from "@/components/admin/client-details/tabs/DrinksTabContent";
import { AdditionalDetailsTabContent } from "@/components/admin/client-details/tabs/AdditionalDetailsTabContent";
import { useClientDetails } from "@/hooks/use-client-details";
import { PackageSection } from "@/components/admin/client-details/PackageSection";
import { PlaceholderCard } from "@/components/admin/client-details/PlaceholderCard";
import { ClientEditForm } from "@/components/admin/client-details/ClientEditForm";
import { CreateUserAccountButton } from "@/components/admin/client-details/CreateUserAccountButton";
import { History, CreditCard, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const {
    client,
    loading,
    isEditMode,
    toggleEditMode,
    updateClientDetails,
    addServings,
    hasUserAccount,
    isUpdating,
    isAddingServings,
    refreshClientData,
    submittedDishes,
    submittedCocktails,
    submittedDrinks,
    error,
  } = useClientDetails(clientId);

  if (loading) {
    return <div className="flex justify-center items-center h-64">טוען...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>שגיאה בטעינת פרטי הלקוח</AlertTitle>
          <AlertDescription>
            {error.message || "אירעה שגיאה לא צפויה. נסה לרענן את העמוד או פנה לתמיכה."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="default">
          <AlertTriangle className="h-4 w-4" /> 
          <AlertTitle>לא נמצא לקוח</AlertTitle>
          <AlertDescription>
            פרטי הלקוח המבוקש לא נמצאו. ייתכן שהקישור שגוי או שהלקוח נמחק.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientHeader restaurantName={client.restaurant_name} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          {isEditMode ? (
            <ClientEditForm
              client={client}
              onSubmit={updateClientDetails}
              onCancel={toggleEditMode}
              isSubmitting={isUpdating}
            />
          ) : (
            <>
              <ClientInfo client={client} onEdit={toggleEditMode} />
              
              <PackageSection 
                client={client} 
                onAddServings={addServings}
                isAddingServings={isAddingServings}
                onClientUpdate={refreshClientData}
              />
              
              {!hasUserAccount && (
                <div className="mt-4">
                  <CreateUserAccountButton client={client} />
                </div>
              )}

              <PlaceholderCard
                title="היסטוריית חבילות"
                description="רשימת החבילות שהלקוח היה מנוי עליהן"
                message="היסטוריית חבילות תהיה זמינה בגרסה הבאה"
                icon={<History className="h-12 w-12 opacity-20" />}
              />
              
              <PlaceholderCard
                title="היסטוריית תשלומים"
                description="רשימת התשלומים והרכישות של הלקוח"
                message="היסטוריית תשלומים תהיה זמינה לאחר אינטגרציה עם שער תשלומים"
                icon={<CreditCard className="h-12 w-12 opacity-20" />}
              />
            </>
          )}
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="dishes">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="dishes">מנות</TabsTrigger>
              <TabsTrigger value="cocktails">קוקטיילים</TabsTrigger>
              <TabsTrigger value="drinks">משקאות</TabsTrigger>
              <TabsTrigger value="details">פרטים נוספים</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dishes">
              <DishesTabContent dishes={submittedDishes} />
            </TabsContent>
            
            <TabsContent value="cocktails">
              <CocktailsTabContent cocktails={submittedCocktails} />
            </TabsContent>
            
            <TabsContent value="drinks">
              <DrinksTabContent drinks={submittedDrinks} />
            </TabsContent>
            
            <TabsContent value="details">
              <AdditionalDetailsTabContent additionalDetails={null} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
