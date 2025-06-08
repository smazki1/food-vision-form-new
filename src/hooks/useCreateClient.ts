import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from '@/types/client';

interface CreateClientData {
  restaurant_name: string;
  contact_name: string;
  phone: string;
  email: string;
  client_status?: string;
  business_type?: string;
  address?: string;
  website_url?: string;
  internal_notes?: string;
  email_notifications?: boolean;
  app_notifications?: boolean;
}

export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      console.log('[useCreateClient] Creating new client:', clientData);
      
      // Check if email already exists
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('client_id')
        .eq('email', clientData.email)
        .maybeSingle();

      if (checkError) {
        console.error('[useCreateClient] Error checking email:', checkError);
        throw checkError;
      }

      if (existingClient) {
        throw new Error('כתובת האימייל כבר קיימת במערכת');
      }

      // Get current user session for user_auth_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fallback for admin/test environment
      const testAdminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
      
      let userAuthId: string;
      
      if (user?.id) {
        userAuthId = user.id;
      } else if (adminAuth) {
        // Use test admin ID when in admin mode without real auth session
        userAuthId = testAdminId;
        console.log('[useCreateClient] Using test admin ID for user_auth_id:', userAuthId);
      } else {
        throw new Error('לא ניתן לזהות משתמש מחובר');
      }

      // Create the new client
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_auth_id: userAuthId, // Use the determined user auth ID
          restaurant_name: clientData.restaurant_name,
          contact_name: clientData.contact_name,
          phone: clientData.phone,
          email: clientData.email,
          client_status: clientData.client_status || 'פעיל',
          business_type: clientData.business_type,
          address: clientData.address,
          website_url: clientData.website_url,
          internal_notes: clientData.internal_notes,
          email_notifications: clientData.email_notifications ?? true,
          app_notifications: clientData.app_notifications ?? true,
          remaining_servings: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[useCreateClient] Database error:', error);
        throw error;
      }

      console.log('[useCreateClient] Successfully created client:', data);
      return data as Client;
    },
    onSuccess: (newClient) => {
      // Update all client-related caches using the same pattern as useClientUpdate
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
          if (!old) return [newClient];
          return [newClient, ...old];
        });
      });

      // Invalidate related queries to ensure they pick up the new client
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            Array.isArray(key) && 
            (key[0] === 'clients' || key[0] === 'dashboard-stats')
          );
        }
      });
      
      toast.success(`לקוח חדש "${newClient.restaurant_name}" נוצר בהצלחה`);
    },
    onError: (error: any) => {
      console.error('[useCreateClient] Mutation error:', error);
      toast.error(`שגיאה ביצירת לקוח חדש: ${error.message}`);
    }
  });
}; 