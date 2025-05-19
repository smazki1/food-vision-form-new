import { useState, useEffect, useCallback } from "react";
import { useClientDetails } from "./useClientDetails";
import { useFoodItems } from "./useFoodItems";
import { useAdditionalDetails } from "./useAdditionalDetails";
import { useFoodVisionLocalStorage } from "./useFoodVisionLocalStorage";
import { useEnsureAtLeastOneDish } from "./useFoodVisionItemsInit";
import { useFoodVisionSubmit } from "./useFoodVisionSubmit";

interface SubmitOptions {
  clientId?: string;
}

export const useFoodVisionForm = () => {
  const [activeTab, setActiveTab] = useState("client");
  const { clientDetails, setClientDetails } = useClientDetails();
  const {
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
  } = useFoodItems();
  const { additionalDetails, setAdditionalDetails } = useAdditionalDetails();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { loadFromStorage, saveToStorage } = useFoodVisionLocalStorage(
    setClientDetails,
    setDishes,
    setCocktails,
    setDrinks,
    setAdditionalDetails
  );

  // Load from localStorage on mount
  useEffect(() => {
    loadFromStorage();
    setInitialized(true);
  }, [loadFromStorage]);

  // Ensure at least one dish after initialization
  useEnsureAtLeastOneDish(initialized, dishes, setDishes);

  // Save to localStorage on change
  useEffect(() => {
    if (!initialized) return;
    saveToStorage({
      clientDetails,
      dishes,
      cocktails,
      drinks,
      additionalDetails,
    });
  }, [
    initialized,
    clientDetails,
    dishes,
    cocktails,
    drinks,
    additionalDetails,
    saveToStorage,
  ]);

  // Call useFoodVisionSubmit at the top level of the useFoodVisionForm hook
  const internalSubmitHandler = useFoodVisionSubmit({
      clientDetails,
      dishes,
      cocktails,
      drinks,
      additionalDetails,
      setActiveTab,
      setClientDetails,
      setDishes,
      setCocktails,
      setDrinks,
      setAdditionalDetails,
      setIsSubmitting,
    // clientId is not passed here, it will be passed to the returned function
  });

  const handleSubmit = useCallback(async (options: SubmitOptions = {}) => {
    // Pass the options (which includes clientId) to the internalSubmitHandler
    return internalSubmitHandler(options);
  }, [internalSubmitHandler]);

  return {
    activeTab,
    setActiveTab,
    clientDetails,
    setClientDetails,
    dishes,
    setDishes,
    cocktails,
    setCocktails,
    drinks,
    setDrinks,
    additionalDetails,
    setAdditionalDetails,
    isSubmitting,
    handleSubmit,
  };
};
