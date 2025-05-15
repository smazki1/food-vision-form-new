
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getClientById, updateClient } from "@/api/clientApi";
import { Client } from "@/types/client";
import { toast } from "sonner";

export function useClientDetails(clientId?: string) {
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch client data
  const {
    data: client,
    isLoading,
    error
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => getClientById(clientId!),
    enabled: !!clientId,
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: (updates: Partial<Client>) => updateClient(clientId!, updates),
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(["client", clientId], updatedClient);
      setIsEditMode(false);
      toast.success("פרטי הלקוח עודכנו בהצלחה");
    },
    onError: (error) => {
      console.error("Error updating client:", error);
      toast.error("שגיאה בעדכון פרטי הלקוח");
    },
  });

  // Add servings mutation
  const addServingsMutation = useMutation({
    mutationFn: (amount: number) => {
      if (!client) throw new Error("Client data not available");
      return updateClient(clientId!, {
        remaining_servings: client.remaining_servings + amount,
        internal_notes: client.internal_notes 
          ? `${client.internal_notes}\n[${new Date().toLocaleString('he-IL')}] נוספו ${amount} מנות באופן ידני.`
          : `[${new Date().toLocaleString('he-IL')}] נוספו ${amount} מנות באופן ידני.`
      });
    },
    onSuccess: (updatedClient) => {
      queryClient.setQueryData(["client", clientId], updatedClient);
      toast.success("המנות נוספו בהצלחה");
    },
    onError: (error) => {
      console.error("Error adding servings:", error);
      toast.error("שגיאה בהוספת מנות");
    },
  });

  // Check if client has a user account
  const hasUserAccount = !!client?.user_auth_id;

  // Toggle edit mode
  const toggleEditMode = () => setIsEditMode(prev => !prev);

  // Update client details
  const updateClientDetails = (data: Partial<Client>) => {
    updateClientMutation.mutate(data);
  };

  // Add servings
  const addServings = (amount: number) => {
    if (amount <= 0) {
      toast.error("יש להזין מספר חיובי של מנות");
      return;
    }
    addServingsMutation.mutate(amount);
  };

  return {
    client,
    loading: isLoading,
    error,
    isEditMode,
    toggleEditMode,
    updateClientDetails,
    addServings,
    hasUserAccount,
    isUpdating: updateClientMutation.isPending,
    isAddingServings: addServingsMutation.isPending
  };
}
