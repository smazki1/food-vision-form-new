import { supabase } from '@/integrations/supabase/client';
import { Lead } from "@/types/models"; // Use models Lead type
import { Client } from '@/types/models';
import { ClientStatus } from '@/constants/statusTypes';
import { CLIENT_STATUSES } from '@/constants/statusTypes';

// Check if a client with the given email already exists
export const checkClientExists = async (email: string) => {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  return data !== null;
};

// Create a new client from a lead
export const createClientFromLead = async (
  lead: Lead,
  packageId: string,
  servingsCount: number
) => {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      restaurant_name: lead.restaurant_name,
      contact_name: lead.contact_name,
      phone: lead.phone, // Use 'phone' from models Lead type
      email: lead.email,
      original_lead_id: lead.lead_id, // Use 'lead_id' from models Lead type
      client_status: "פעיל", // CLIENT_STATUSES.ACTIVE
      remaining_servings: servingsCount,
      current_package_id: packageId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const clientsAPI = {
  async fetchClients(options: {
    statuses?: ClientStatus[];
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  } = {}): Promise<Client[]> {
    try {
      const {
        statuses,
        searchTerm,
        sortBy = 'created_at',
        sortDirection = 'desc',
        page = 0,
        pageSize = 20
      } = options;

      let query = supabase
        .from('clients')
        .select('*');

      if (statuses && statuses.length > 0) {
        query = query.in('client_status', statuses);
      } else {
        const activeStatuses = Object.values(CLIENT_STATUSES).filter(
            status => status === CLIENT_STATUSES.ACTIVE
        );
        if (activeStatuses.length > 0) {
            query = query.in('client_status', activeStatuses);
        }
      }

      if (searchTerm) {
        query = query.or(
          `restaurant_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
        );
      }

      query = query
        .order(sortBy, { ascending: sortDirection === 'asc' })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error } = await query;
      if (error) throw new Error(`Error fetching clients: ${error.message}`);
      return data as Client[];
    } catch (error) {
      console.error('Error in fetchClients:', error);
      throw error;
    }
  },

  async fetchClientById(clientId: string): Promise<Client> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (error) throw new Error(`Error fetching client: ${error.message}`);
      return data as Client;
    } catch (error) {
      console.error(`Error fetching client ${clientId}:`, error);
      throw error;
    }
  },
};
