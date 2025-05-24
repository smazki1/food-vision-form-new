import { useState, useEffect, useCallback } from "react";
import { getClientDetails, updateClientDetails as updateClient, addServingsToClient } from "@/api/clientApi";
import { 
  getUniqueSubmittedDishDetailsForClient,
  getUniqueSubmittedCocktailDetailsForClient,
  getUniqueSubmittedDrinkDetailsForClient
} from "@/api/submissionApi";
import { Client } from "@/types/client";
// Import the new shared types
import { DishDetailsForTab, CocktailDetailsForTab, DrinkDetailsForTab } from "@/types/food-vision"; 
import { toast } from "sonner";

export const useClientDetails = (clientId?: string) => {
  const [client, setClient] = useState<Client | null>(null);
  const [submittedDishes, setSubmittedDishes] = useState<DishDetailsForTab[]>([]); // State for submitted dishes
  const [submittedCocktails, setSubmittedCocktails] = useState<CocktailDetailsForTab[]>([]); // State for submitted cocktails
  const [submittedDrinks, setSubmittedDrinks] = useState<DrinkDetailsForTab[]>([]); // State for submitted drinks
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isAddingServings, setIsAddingServings] = useState<boolean>(false);

  const fetchClientData = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Fetch client details and dish submissions in parallel or sequentially
      const clientData = await getClientDetails(clientId);
      setClient(clientData);
      
      if (clientData) { // Only fetch items if client exists
        // Fetch in parallel for slightly better performance
        const [dishDetails, cocktailDetails, drinkDetails] = await Promise.all([
          getUniqueSubmittedDishDetailsForClient(clientId),
          getUniqueSubmittedCocktailDetailsForClient(clientId),
          getUniqueSubmittedDrinkDetailsForClient(clientId)
        ]);
        setSubmittedDishes(dishDetails);
        setSubmittedCocktails(cocktailDetails);
        setSubmittedDrinks(drinkDetails);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch client details"));
      toast.error("שגיאה בטעינת פרטי הלקוח");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  // Function to refresh client data
  const refreshClientData = useCallback(async () => {
    await fetchClientData();
  }, [fetchClientData]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const toggleEditMode = () => setIsEditMode(!isEditMode);

  const updateClientDetails = async (data: Partial<Client>) => {
    if (!clientId || !client) return;

    try {
      setIsUpdating(true);
      const updatedClient = await updateClient(clientId, data);
      setClient(updatedClient);
      setIsEditMode(false);
      toast.success("פרטי הלקוח עודכנו בהצלחה");
    } catch (err) {
      console.error("Error updating client details:", err);
      toast.error("שגיאה בעדכון פרטי הלקוח");
    } finally {
      setIsUpdating(false);
    }
  };

  const addServings = async (amount: number) => {
    if (!clientId || !client) return;

    try {
      setIsAddingServings(true);
      const updatedClient = await addServingsToClient(clientId, amount);
      setClient(updatedClient);
      toast.success(`${amount} מנות נוספו בהצלחה`);
    } catch (err) {
      console.error("Error adding servings:", err);
      toast.error("שגיאה בהוספת מנות");
    } finally {
      setIsAddingServings(false);
    }
  };

  const hasUserAccount = !!client?.user_auth_id;

  return {
    client,
    submittedDishes, // Return submitted dishes
    submittedCocktails, // Return submitted cocktails
    submittedDrinks, // Return submitted drinks
    loading,
    error,
    isEditMode,
    toggleEditMode,
    updateClientDetails,
    addServings,
    hasUserAccount,
    isUpdating,
    isAddingServings,
    refreshClientData
  };
};
