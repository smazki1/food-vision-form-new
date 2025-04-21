import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { CollapsibleFoodItem } from "@/components/admin/CollapsibleFoodItem";

type ClientData = {
  client: {
    client_id: string;
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
    created_at: string;
  } | null;
  dishes: Array<{
    dish_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  cocktails: Array<{
    cocktail_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  drinks: Array<{
    drink_id: string;
    name: string;
    ingredients: string;
    description: string;
    notes: string;
    reference_image_urls: string[];
  }>;
  additionalDetails: {
    visual_style: string;
    brand_colors: string;
    general_notes: string;
    branding_materials_url: string;
  } | null;
};

const ClientDetails: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [clientData, setClientData] = useState<ClientData>({
    client: null,
    dishes: [],
    cocktails: [],
    drinks: [],
    additionalDetails: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchClientData(clientId);
    }
  }, [clientId]);

  const fetchClientData = async (id: string) => {
    try {
      setLoading(true);
      
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", id)
        .single();
      
      if (clientError) throw clientError;

      const { data: dishes, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("client_id", id);
      
      if (dishesError) throw dishesError;

      const { data: cocktails, error: cocktailsError } = await supabase
        .from("cocktails")
        .select("*")
        .eq("client_id", id);
      
      if (cocktailsError) throw cocktailsError;

      const { data: drinks, error: drinksError } = await supabase
        .from("drinks")
        .select("*")
        .eq("client_id", id);
      
      if (drinksError) throw drinksError;

      const { data: additionalDetails, error: detailsError } = await supabase
        .from("additional_details")
        .select("*")
        .eq("client_id", id)
        .single();
      
      setClientData({
        client,
        dishes: dishes || [],
        cocktails: cocktails || [],
        drinks: drinks || [],
        additionalDetails: additionalDetails || null,
      });
    } catch (error) {
      console.error("Error fetching client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("he-IL");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{clientData.client?.restaurant_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>פרטי לקוח</CardTitle>
            <CardDescription>
              נוצר בתאריך {formatDate(clientData.client?.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">שם מסעדה</h3>
                <p>{clientData.client?.restaurant_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">איש קשר</h3>
                <p>{clientData.client?.contact_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">טלפון</h3>
                <p>{clientData.client?.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">אימייל</h3>
                <p>{clientData.client?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                      {...dish}
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
                      {...cocktail}
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
                      {...drink}
                    />
                  ))}
                  <Button
                    className="w-full bg-[#F3752B] hover:bg-[#F3752B]/90 mt-4"
                    onClick={() => window.location.href = '/'}
                  >
                    <PlusCircle className="h-4 w-4 ml-2" />
                    הוסף משקה חדשה
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
                    הוסף משקה חדשה
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
                    <div className="text-center py-4 text-muted-foreground">לא נוספו פרטים נוספים</div>
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
