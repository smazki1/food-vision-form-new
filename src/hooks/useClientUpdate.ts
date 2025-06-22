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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, status }: { clientId: string; status: string }) => {
      console.log('[useClientStatusUpdate] Updating client status:', clientId, status);
      
      const { error } = await supabase
        .from('clients')
        .update({
          client_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) {
        console.error('[useClientStatusUpdate] Database error:', error);
        throw error;
      }

      return { clientId, status };
    },

    onSuccess: (data) => {
      // Update all client caches optimistically
      const allCaches = queryClient.getQueryCache().getAll();
      const clientCaches = allCaches.filter(cache => {
        const key = cache.queryKey;
        return (
          (Array.isArray(key) && key[0] === 'clients_simplified') ||
          (Array.isArray(key) && key[0] === 'clients_list_for_admin')
        );
      });

      clientCaches.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: Client[] | undefined) => {
          if (!old) return old;
          return old.map(client => 
            client.client_id === data.clientId 
              ? { ...client, client_status: data.status, updated_at: new Date().toISOString() }
              : client
          );
        });
      });
    },

    onError: (error: any) => {
      console.error('[useClientStatusUpdate] Mutation error:', error);
      toast.error('שגיאה בעדכון סטטוס הלקוח');
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

export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    onMutate: async (clientId: string) => {
      console.log('[useDeleteClient] Starting optimistic update for client:', clientId);
      
      // Optimistically remove client from all caches immediately
      const allCaches = queryClient.getQueryCache().getAll();
      const clientCaches = allCaches.filter(cache => {
        const key = cache.queryKey;
        return (
          (Array.isArray(key) && key[0] === 'clients_simplified') ||
          (Array.isArray(key) && key[0] === 'clients_list_for_admin') ||
          (Array.isArray(key) && key[0] === 'clients')
        );
      });

      // Snapshot previous values for rollback
      const previousCaches = clientCaches.map(cache => ({
        queryKey: cache.queryKey,
        data: cache.state.data
      }));

      // Remove client immediately from all caches
      clientCaches.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((client: any) => client.client_id !== clientId);
        });
      });

      return { previousCaches };
    },
    mutationFn: async (clientId: string) => {
      console.log('[useDeleteClient] Deleting client:', clientId);
      
      // Check if client has submissions (for warning purposes only)
      const { data: submissions, error: submissionsError } = await supabase
        .from('customer_submissions')
        .select('submission_id')
        .eq('client_id', clientId);

      if (submissionsError) {
        console.error('[useDeleteClient] Error checking submissions:', submissionsError);
        throw submissionsError;
      }

      // Handle submissions - delete them first to avoid foreign key constraint
      if (submissions && submissions.length > 0) {
        console.log(`[useDeleteClient] Found ${submissions.length} submissions. Deleting them first...`);
        
        // Delete all submissions for this client
        const { error: deleteSubmissionsError } = await supabase
          .from('customer_submissions')
          .delete()
          .eq('client_id', clientId);

        if (deleteSubmissionsError) {
          console.error('[useDeleteClient] Error deleting submissions:', deleteSubmissionsError);
          throw deleteSubmissionsError;
        }
        
        console.log('[useDeleteClient] Successfully deleted all submissions');
      }

      // Check if client has a current package assigned
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('current_package_id')
        .eq('client_id', clientId)
        .single();

      if (clientError) {
        console.error('[useDeleteClient] Error checking client package:', clientError);
        throw clientError;
      }

      // Clean up related data before deletion
      console.log('[useDeleteClient] Cleaning up related data...');
      await Promise.all([
        supabase.from('dishes').delete().eq('client_id', clientId),
        supabase.from('cocktails').delete().eq('client_id', clientId), 
        supabase.from('drinks').delete().eq('client_id', clientId)
      ]);

      // Delete the client
      console.log('[useDeleteClient] Deleting client from database...');
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('client_id', clientId);

      if (error) {
        console.error('[useDeleteClient] Error deleting client:', error);
        throw error;
      }
      
      console.log('[useDeleteClient] Client deleted successfully');
      return clientId;
    },
    onSuccess: (deletedClientId) => {
      console.log('[useDeleteClient] Delete mutation successful, updating caches');
      
      // Update all client caches optimistically - same pattern as other client hooks
      const allCaches = queryClient.getQueryCache().getAll();
      const clientCaches = allCaches.filter(cache => {
        const key = cache.queryKey;
        return (
          (Array.isArray(key) && key[0] === 'clients_simplified') ||
          (Array.isArray(key) && key[0] === 'clients_list_for_admin') ||
          (Array.isArray(key) && key[0] === 'clients')
        );
      });

      // Remove the deleted client from all relevant caches
      clientCaches.forEach(cache => {
        queryClient.setQueryData(cache.queryKey, (old: any[] | undefined) => {
          if (!old) return old;
          return old.filter((client: any) => client.client_id !== deletedClientId);
        });
      });
      
      toast.success('הלקוח נמחק בהצלחה מהמערכת');
    },
    onError: (error: any, clientId: string, context: any) => {
      console.error('[useDeleteClient] Delete mutation failed, rolling back:', error);
      
      // Rollback optimistic updates if deletion failed
      if (context?.previousCaches) {
        context.previousCaches.forEach(({ queryKey, data }: any) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      
      toast.error(`שגיאה במחיקת הלקוח: ${error.message}`);
    }
  });
}; 