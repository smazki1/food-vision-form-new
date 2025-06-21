
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export const clientsAPI = {
  async createClient(clientData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
    original_lead_id?: string;
    user_auth_id: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          restaurant_name: clientData.restaurant_name,
          contact_name: clientData.contact_name,
          phone: clientData.phone,
          email: clientData.email,
          original_lead_id: clientData.original_lead_id || null,
          user_auth_id: clientData.user_auth_id,
          client_status: 'active',
          remaining_servings: 0,
          current_package_id: null
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error: any) {
      console.error('Error creating client:', error);
      return { success: false, error: error.message };
    }
  },

  async getClientById(clientId: string) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) throw error;
      return { success: true, client: data };
    } catch (error: any) {
      console.error('Error fetching client:', error);
      return { success: false, error: error.message };
    }
  }
};
