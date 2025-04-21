
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

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clientData, loading } = useClientDetails(clientId);

  if (loading) {
    return <div>טוען...</div>;
  }

  if (!clientData.client) {
    return <div>לא נמצא לקוח</div>;
  }

  return (
    <div className="space-y-6">
      <ClientHeader restaurantName={clientData.client.restaurant_name} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <ClientInfo client={clientData.client} />
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="dishes">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="dishes">מנות ({clientData.dishes.length})</TabsTrigger>
              <TabsTrigger value="cocktails">קוקטיילים ({clientData.cocktails.length})</TabsTrigger>
              <TabsTrigger value="drinks">משקאות ({clientData.drinks.length})</TabsTrigger>
              <TabsTrigger value="details">פרטים נוספים</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dishes">
              <DishesTabContent dishes={clientData.dishes} />
            </TabsContent>
            
            <TabsContent value="cocktails">
              <CocktailsTabContent cocktails={clientData.cocktails} />
            </TabsContent>
            
            <TabsContent value="drinks">
              <DrinksTabContent drinks={clientData.drinks} />
            </TabsContent>
            
            <TabsContent value="details">
              <AdditionalDetailsTabContent additionalDetails={clientData.additionalDetails} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
