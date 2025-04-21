
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

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
      
      // Fetch client details
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("client_id", id)
        .single();
      
      if (clientError) throw clientError;

      // Fetch dishes
      const { data: dishes, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("client_id", id);
      
      if (dishesError) throw dishesError;

      // Fetch cocktails
      const { data: cocktails, error: cocktailsError } = await supabase
        .from("cocktails")
        .select("*")
        .eq("client_id", id);
      
      if (cocktailsError) throw cocktailsError;

      // Fetch drinks
      const { data: drinks, error: drinksError } = await supabase
        .from("drinks")
        .select("*")
        .eq("client_id", id);
      
      if (drinksError) throw drinksError;

      // Fetch additional details
      const { data: additionalDetails, error: detailsError } = await supabase
        .from("additional_details")
        .select("*")
        .eq("client_id", id)
        .single();
      
      // Not throwing error for additional details as it might not exist

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

  const FoodItemCard = ({ 
    name, 
    ingredients, 
    description, 
    notes, 
    images 
  }: { 
    name: string; 
    ingredients: string; 
    description: string; 
    notes: string; 
    images: string[] 
  }) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ingredients && (
            <div>
              <h4 className="font-semibold mb-1">מרכיבים:</h4>
              <p>{ingredients}</p>
            </div>
          )}
          
          {description && (
            <div>
              <h4 className="font-semibold mb-1">תיאור:</h4>
              <p>{description}</p>
            </div>
          )}
          
          {notes && (
            <div>
              <h4 className="font-semibold mb-1">הערות:</h4>
              <p>{notes}</p>
            </div>
          )}
          
          {images && images.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">תמונות:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {images.map((url, index) => (
                  <div key={index} className="relative rounded-md overflow-hidden border">
                    <AspectRatio ratio={4/3}>
                      <img 
                        src={url} 
                        alt={`${name} ${index + 1}`}
                        className="object-cover w-full h-full" 
                      />
                    </AspectRatio>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-full">טוען נתונים...</div>;
  }

  if (!clientData.client) {
    return <div className="text-center py-8">לקוח לא נמצא</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to="/admin/clients">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{clientData.client.restaurant_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>פרטי לקוח</CardTitle>
            <CardDescription>
              נוצר בתאריך {formatDate(clientData.client.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">שם מסעדה</h3>
                <p>{clientData.client.restaurant_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">איש קשר</h3>
                <p>{clientData.client.contact_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">טלפון</h3>
                <p>{clientData.client.phone}</p>
              </div>
              <div>
                <h3 className="font-semibold text-sm">אימייל</h3>
                <p>{clientData.client.email}</p>
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
                clientData.dishes.map((dish) => (
                  <FoodItemCard
                    key={dish.dish_id}
                    name={dish.name}
                    ingredients={dish.ingredients}
                    description={dish.description}
                    notes={dish.notes}
                    images={dish.reference_image_urls}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">לא נוספו מנות</div>
              )}
            </TabsContent>
            
            <TabsContent value="cocktails">
              {clientData.cocktails.length > 0 ? (
                clientData.cocktails.map((cocktail) => (
                  <FoodItemCard
                    key={cocktail.cocktail_id}
                    name={cocktail.name}
                    ingredients={cocktail.ingredients}
                    description={cocktail.description}
                    notes={cocktail.notes}
                    images={cocktail.reference_image_urls}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">לא נוספו קוקטיילים</div>
              )}
            </TabsContent>
            
            <TabsContent value="drinks">
              {clientData.drinks.length > 0 ? (
                clientData.drinks.map((drink) => (
                  <FoodItemCard
                    key={drink.drink_id}
                    name={drink.name}
                    ingredients={drink.ingredients}
                    description={drink.description}
                    notes={drink.notes}
                    images={drink.reference_image_urls}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">לא נוספו משקאות</div>
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
