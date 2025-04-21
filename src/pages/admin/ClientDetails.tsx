
import React from "react";
import { useParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";
import { ClientHeader } from "@/components/admin/client-details/ClientHeader";
import { ClientInfo } from "@/components/admin/client-details/ClientInfo";
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
              {clientData.dishes.length > 0 ? (
                <div className="space-y-4">
                  {clientData.dishes.map((dish, index) => (
                    <CollapsibleFoodItem
                      key={dish.dish_id}
                      title={`מנה ${index + 1}: ${dish.name}`}
                      name={dish.name}
                      ingredients={dish.ingredients}
                      description={dish.description}
                      notes={dish.notes}
                      images={dish.reference_image_urls}
                    />
                  ))}
                  <Button
                    className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף מנה חדשה
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">לא נוספו מנות</p>
                  <Button
                    className="bg-[#F3752B] hover:bg-[#F3752B]/90"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף מנה חדשה
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cocktails">
              {clientData.cocktails.length > 0 ? (
                <div className="space-y-4">
                  {clientData.cocktails.map((cocktail, index) => (
                    <CollapsibleFoodItem
                      key={cocktail.cocktail_id}
                      title={`קוקטייל ${index + 1}: ${cocktail.name}`}
                      name={cocktail.name}
                      ingredients={cocktail.ingredients}
                      description={cocktail.description}
                      notes={cocktail.notes}
                      images={cocktail.reference_image_urls}
                    />
                  ))}
                  <Button
                    className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף קוקטייל חדש
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">לא נוספו קוקטיילים</p>
                  <Button
                    className="bg-[#F3752B] hover:bg-[#F3752B]/90"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף קוקטייל חדש
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="drinks">
              {clientData.drinks.length > 0 ? (
                <div className="space-y-4">
                  {clientData.drinks.map((drink, index) => (
                    <CollapsibleFoodItem
                      key={drink.drink_id}
                      title={`משקה ${index + 1}: ${drink.name}`}
                      name={drink.name}
                      ingredients={drink.ingredients}
                      description={drink.description}
                      notes={drink.notes}
                      images={drink.reference_image_urls}
                    />
                  ))}
                  <Button
                    className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף משקה חדש
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">לא נוספו משקאות</p>
                  <Button
                    className="bg-[#F3752B] hover:bg-[#F3752B]/90"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף משקה חדש
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>פרטים נוספים</CardTitle>
                </CardHeader>
                <CardContent>
                  {clientData.additionalDetails ? (
                    <div className="space-y-4">
                      {clientData.additionalDetails.visual_style && (
                        <div>
                          <h4 className="font-semibold mb-1">סגנון חזותי:</h4>
                          <p>{clientData.additionalDetails.visual_style}</p>
                        </div>
                      )}
                      
                      {clientData.additionalDetails.brand_colors && (
                        <div>
                          <h4 className="font-semibold mb-1">צבעי מותג:</h4>
                          <p>{clientData.additionalDetails.brand_colors}</p>
                        </div>
                      )}
                      
                      {clientData.additionalDetails.general_notes && (
                        <div>
                          <h4 className="font-semibold mb-1">הערות כלליות:</h4>
                          <p>{clientData.additionalDetails.general_notes}</p>
                        </div>
                      )}
                      
                      {clientData.additionalDetails.branding_materials_url && (
                        <div>
                          <h4 className="font-semibold mb-1">חומרי מיתוג:</h4>
                          <a 
                            href={clientData.additionalDetails.branding_materials_url} 
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            הצג חומרי מיתוג
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      לא נוספו פרטים נוספים
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
