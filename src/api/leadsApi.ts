
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type LeadInsert = Database['public']['Tables']['leads']['Insert'];

export const leadsAPI = {
  async createLead(leadData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
    business_type?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          restaurant_name: leadData.restaurant_name,
          contact_name: leadData.contact_name,
          phone: leadData.phone,
          email: leadData.email,
          business_type: leadData.business_type || null,
          status: 'new',
          lead_status: 'ליד חדש'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, lead: data };
    } catch (error: any) {
      console.error('Error creating lead:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllLeads() {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      return [];
    }
  },

  async getLeadById(leadId: string) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching lead:', error);
      return null;
    }
  },

  async updateLead(leadId: string, updates: Partial<LeadInsert>) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, lead: data };
    } catch (error: any) {
      console.error('Error updating lead:', error);
      return { success: false, error: error.message };
    }
  },

  async convertLeadToClient(leadId: string, packageId: string) {
    try {
      // Use direct SQL approach since RPC might not exist
      const { data, error } = await supabase
        .from('leads')
        .update({ status: 'converted' })
        .eq('lead_id', leadId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, clientId: data.lead_id };
    } catch (error: any) {
      console.error('Error converting lead to client:', error);
      return { success: false, error: error.message };
    }
  }
};
