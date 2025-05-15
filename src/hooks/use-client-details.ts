
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";

export type ClientData = {
  client: Client | null;
  dishes: any[];
  cocktails: any[];
  drinks: any[];
  additionalDetails: any | null;
};

export const useClientDetails = (clientId: string | undefined) => {
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

  return { clientData, loading };
};
