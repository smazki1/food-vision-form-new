import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';

interface UpdateClientData {
  clientId: string;
  updates: Partial<Client>;
}

export const useClientUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, updates }: UpdateClientData) => {
      console.log('[useClientUpdate] Updating client:', clientId, updates);
      
      // Remove any undefined or null values to avoid database issues
      const cleanedUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== undefined)
      );

      const { error } = await supabase
        .from('clients')
        .update({
          ...cleanedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('[useClientUpdate] Database error:', error);
        throw error;
      }

      // Create a mock data object for return (cache invalidation will refetch real data)
      const updatedClient = { client_id: clientId, ...cleanedUpdates };
      console.log('[useClientUpdate] Successfully updated client:', updatedClient);
      return updatedClient as Client;
    },
    onMutate: async ({ clientId, updates }) => {
      // CRITICAL FIX: Use a more stable approach to prevent UI disruption
      // Only cancel queries that are actively refetching to prevent component unmounting
      
      // Get all cached queries that match our patterns
      const allCaches = queryClient.getQueryCache().getAll();
      const clientCaches = allCaches.filter(cache => {
        const key = cache.queryKey;
        return (
          (Array.isArray(key) && key[0] === 'clients_simplified') ||
          (Array.isArray(key) && key[0] === 'clients_list_for_admin')
        );
      });

      // Snapshot all previous values for rollback
      const previousCaches = clientCaches.map(cache => ({
        queryKey: cache.queryKey,
        data: cache.state.data
      }));

      // Optimistically update all client-related caches immediately without canceling
      clientCaches.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: Client[] | undefined) => {
          if (!old) return old;
          return old.map(client => 
            client.client_id === clientId 
              ? { ...client, ...updates, updated_at: new Date().toISOString() }
              : client
          );
        });
      });

      // Return a context object with the snapshotted values
      return { previousCaches };
    },
    onError: (err, { clientId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCaches) {
        context.previousCaches.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      console.error('[useClientUpdate] Mutation error:', err);
      toast.error(`שגיאה בעדכון פרטי הלקוח: ${err.message}`);
    },
    onSuccess: (data, { updates, clientId }) => {
      // CRITICAL FIX: Use optimistic updates ONLY, no cache invalidation to prevent component unmounting
      const allCaches = queryClient.getQueryCache().getAll();
      const clientCaches = allCaches.filter(cache => {
        const key = cache.queryKey;
        return (
          (Array.isArray(key) && key[0] === 'clients_simplified') ||
          (Array.isArray(key) && key[0] === 'clients_list_for_admin')
        );
      });

      // Update all client caches with optimistic data - this prevents re-fetching and component disruption
      clientCaches.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: Client[] | undefined) => {
          if (!old) return old;
          return old.map(client => 
            client.client_id === clientId 
              ? { ...client, ...updates, updated_at: new Date().toISOString() }
              : client
          );
        });
      });
      
      // Determine which field was updated for the success message
      const updatedFields = Object.keys(updates);
      const fieldName = updatedFields.length === 1 ? updatedFields[0] : 'פרטי הלקוח';
      
      const hebrewFieldNames: { [key: string]: string } = {
        restaurant_name: 'שם המסעדה',
        contact_name: 'איש קשר',
        phone: 'טלפון',
        email: 'אימייל',
        business_type: 'סוג עסק',
        client_status: 'סטטוס לקוח',
        address: 'כתובת',
        website_url: 'אתר אינטרנט',
        internal_notes: 'הערות פנימיות',
        payment_status: 'סטטוס תשלום',
        payment_amount_ils: 'סכום תשלום',
        payment_due_date: 'תאריך תשלום',
        next_follow_up_date: 'תאריך תזכורת',
        reminder_details: 'פרטי תזכורת',
        notes: 'הערות'
      };

      const displayName = hebrewFieldNames[fieldName] || fieldName;
      toast.success(`${displayName} עודכן בהצלחה`);
    },
  });
};

// Specific hook for updating client status
export const useClientStatusUpdate = () => {
  const updateClient = useClientUpdate();

  return useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      return updateClient.mutateAsync({
        clientId,
        updates: { client_status: status }
      });
    },
    onSuccess: () => {
      // No additional cache invalidation needed - parent hook handles everything
      toast.success('סטטוס הלקוח עודכן בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון סטטוס הלקוח: ${error.message}`);
    }
  });
};

// Specific hook for updating payment status
export const useClientPaymentUpdate = () => {
  const updateClient = useClientUpdate();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      paymentStatus, 
      amount, 
      dueDate 
    }: { 
      clientId: string; 
      paymentStatus: string;
      amount?: number;
      dueDate?: string;
    }) => {
      const updates: Partial<Client> = {
        payment_status: paymentStatus,
      };

      if (amount !== undefined) {
        updates.payment_amount_ils = amount;
      }
      
      if (dueDate) {
        updates.payment_due_date = dueDate;
      }

      return updateClient.mutateAsync({ clientId, updates });
    },
    onSuccess: () => {
      toast.success('פרטי התשלום עודכנו בהצלחה');
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון פרטי התשלום: ${error.message}`);
    }
  });
}; 