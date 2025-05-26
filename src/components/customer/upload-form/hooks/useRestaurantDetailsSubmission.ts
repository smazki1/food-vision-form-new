
import { useState } from 'react';
import { toast } from "sonner";
import { getOrCreateClient } from '@/utils/client-utils';
import { ClientDetails as FoodVisionClientDetails } from '@/types/food-vision';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { NewItemFormData } from '@/contexts/NewItemFormContext';

export const useRestaurantDetailsSubmission = (
  refreshClientAuth?: () => void
) => {
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const { user: unifiedUser } = useUnifiedAuth();

  const handleRestaurantDetailsSubmit = async (
    formData: NewItemFormData,
    setStepErrors: (errors: Record<string, string>) => void
  ) => {
    setIsCreatingClient(true);
    toast.info("יוצרים או מאמתים את פרטי המסעדה...");
    
    try {
      const clientDetailsPayload: FoodVisionClientDetails = {
        restaurantName: formData.restaurantName || '',
        contactName: 'לא סופק',
        phoneNumber: 'לא סופק',
        email: 'לא סופק',
      };

      const authUserId = unifiedUser?.id;
      
      console.log("[useRestaurantDetailsSubmission] Calling getOrCreateClient with payload:", clientDetailsPayload, "and authUserId:", authUserId);
      const newClientId = await getOrCreateClient(clientDetailsPayload, authUserId);
      console.log("[useRestaurantDetailsSubmission] getOrCreateClient returned newClientId:", newClientId);

      if (refreshClientAuth) {
        console.log("[useRestaurantDetailsSubmission] Calling refreshClientAuth().");
        refreshClientAuth();
      }

      toast.success("פרטי מסעדה אומתו בהצלחה! מזהה לקוח חדש/מאומת: " + newClientId.substring(0, 8) + "...");
      return true;

    } catch (error: any) {
      console.error("[useRestaurantDetailsSubmission] Error:", error);
      let errorMessage = "שגיאה באימת פרטי המסעדה.";
      if (error.message) {
        errorMessage = error.message.includes("duplicate key value violates unique constraint") 
          ? "כתובת אימייל זו כבר משויכת למסעדה קיימת. אנא השתמשו בכתובת אחרת או התחברו אם זו המסעדה שלכם/ן."
          : error.message;
      }
      setStepErrors({ submit: errorMessage });
      toast.error(errorMessage);
      return false;
    } finally {
      setIsCreatingClient(false);
    }
  };

  return {
    handleRestaurantDetailsSubmit,
    isCreatingClient
  };
};
