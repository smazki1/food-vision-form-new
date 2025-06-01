import { supabase } from '@/integrations/supabase/client';
import { Lead, LeadStatus } from '@/types/models'; // Use models types consistently
import { LEAD_STATUSES, LEAD_STATUS_DISPLAY } from '@/constants/statusTypes';

// Temporary types until LeadInsert/LeadUpdate are fixed in models.ts
type LeadInsert = Partial<Lead>;
type LeadUpdate = Partial<Lead>;

export const leadsAPI = {
  async fetchLeads(options: {
    statuses?: LeadStatus[];
    searchTerm?: string;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  } = {}): Promise<Lead[]> {
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
        .from('leads')
        .select('*');

      if (statuses && statuses.length > 0) {
        query = query.in('lead_status', statuses);
      } else {
        const activeStatuses = Object.values(LEAD_STATUSES).filter(
          (status: LeadStatus) => status !== (LEAD_STATUSES.ARCHIVED as LeadStatus)
        );
        query = query.in('lead_status', activeStatuses);
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

      if (error) throw new Error(`Error fetching leads: ${error.message}`);
      return data || [];
    } catch (error: any) {
      console.error('Error in fetchLeads:', error);
      throw new Error(error.message || 'Unknown error fetching leads');
    }
  },

  async fetchLeadById(leadId: string): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) throw new Error(`Error fetching lead: ${error.message}`);
      if (!data) throw new Error(`Lead with ID ${leadId} not found.`);
      return data;
    } catch (error: any) {
      console.error(`Error fetching lead ${leadId}:`, error);
      throw new Error(error.message || `Unknown error fetching lead ${leadId}`);
    }
  },

  async addLeadActivityLog(leadId: string, activityType: string, activityDescription: string, _activityExtraData?: object | null): Promise<void> {
    try {
      const { error } = await supabase
        .from('lead_activity_log')
        .insert({
          lead_id: leadId,
          activity_type: activityType,
          activity_description: activityDescription,
          activity_timestamp: new Date().toISOString(),
        });

      if (error) {
        console.error(`Error adding activity for lead ${leadId}:`, error);
      }
    } catch (error: any) {
      console.error(`Unexpected error in addLeadActivityLog for lead ${leadId}:`, error);
    }
  },

  async createLead(leadData: LeadInsert): Promise<Lead> {
    try {
      const now = new Date().toISOString();

      const newLeadData: LeadInsert = {
        ...leadData,
        lead_status: leadData.lead_status || LEAD_STATUSES.NEW,
        created_at: now,
        updated_at: now,
        ai_trainings_count: leadData.ai_trainings_count || 0,
        ai_training_cost_per_unit: leadData.ai_training_cost_per_unit || 1.5,
        ai_prompts_count: leadData.ai_prompts_count || 0,
        ai_prompt_cost_per_unit: leadData.ai_prompt_cost_per_unit || 0.16,
        free_sample_package_active: leadData.free_sample_package_active || false
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(newLeadData)
        .select('*')
        .single();

      if (error) throw new Error(`Error creating lead: ${error.message}`);
      if (!data) throw new Error('Failed to create lead or retrieve created data.');

      if (data?.lead_id) {
        await this.addLeadActivityLog(data.lead_id, 'ליד חדש נוצר', 'ליד חדש נוצר');
      }
      return data as Lead;
    } catch (error: any) {
      console.error('Error in createLead:', error);
      throw new Error(error.message || 'Unknown error creating lead');
    }
  },

  async _updateLeadInternal(leadId: string, updates: LeadUpdate): Promise<Lead> {
    const dataToUpdate: LeadUpdate = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('leads')
      .update(dataToUpdate)
      .eq('lead_id', leadId)
      .select('*')
      .single();

    if (error) throw new Error(`Error updating lead internal: ${error.message}`);
    if (!data) throw new Error(`Failed to update lead or lead ${leadId} not found.`);
    return data as Lead;
  },

  async updateLead(leadId: string, updates: LeadUpdate): Promise<Lead> {
    try {
      const updatedLead = await this._updateLeadInternal(leadId, updates);

      const activityType = updates.lead_status ? 'סטטוס ליד עודכן' : 'פרטי ליד עודכנו';
      const activityDescription = updates.lead_status
        ? `סטטוס ליד שונה ל: ${LEAD_STATUS_DISPLAY[updates.lead_status as LeadStatus] || updates.lead_status}`
        : 'פרטי ליד עודכנו';
      
      await this.addLeadActivityLog(leadId, activityType, activityDescription);
      
      return updatedLead;
    } catch (error: any) {
      console.error(`Error updating lead ${leadId}:`, error);
      throw new Error(error.message || `Unknown error updating lead ${leadId}`);
    }
  },

  async convertToClient(leadId: string, userId: string): Promise<{ client_id: string, user_id: string, updatedLead: Lead }> {
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'create_client_from_lead',
        { p_lead_id: leadId, p_user_id: userId }
      );

      if (rpcError) throw new Error(`Error in RPC create_client_from_lead: ${rpcError.message}`);
      
      const returnedClientId = (rpcData as any)?.client_id || (typeof rpcData === 'string' ? rpcData : null);
      const returnedUserId = (rpcData as any)?.user_id || userId;

      if (!returnedClientId) {
        throw new Error('RPC create_client_from_lead did not return client_id.');
      }

      const statusConverted = (LEAD_STATUSES as any).CONVERTED_TO_CLIENT || 'הפך ללקוח';
      const updatedLeadData = await this._updateLeadInternal(leadId, { lead_status: statusConverted as LeadStatus });
      
      const activityDescription = `הליד הומר ללקוח. Client ID: ${returnedClientId}, User ID: ${returnedUserId}`;
      await this.addLeadActivityLog(leadId, 'המרת ליד ללקוח', activityDescription);

      return {
        client_id: returnedClientId,
        user_id: returnedUserId,
        updatedLead: updatedLeadData,
      };
    } catch (error: any) {
      console.error(`Error converting lead ${leadId} to client:`, error);
      throw new Error(error.message || `Unknown error converting lead ${leadId}`);
    }
  },

  async archiveLead(leadId: string): Promise<Lead> {
    try {
      const statusArchived = LEAD_STATUSES.ARCHIVED || 'ארכיון';
      const updatedLead = await this._updateLeadInternal(leadId, { lead_status: statusArchived as LeadStatus });
      await this.addLeadActivityLog(leadId, 'העברה לארכיון', 'הליד הועבר לארכיון');
      return updatedLead;
    } catch (error: any) {
      console.error(`Error archiving lead ${leadId}:`, error);
      throw new Error(error.message || `Unknown error archiving lead ${leadId}`);
    }
  },

  async restoreFromArchive(leadId: string, newStatus?: LeadStatus): Promise<Lead> {
    try {
      const statusToRestore = newStatus || (LEAD_STATUSES.NEW as LeadStatus) || ('ליד חדש' as LeadStatus);
      const updatedLead = await this._updateLeadInternal(leadId, { lead_status: statusToRestore });
      
      const activityDescription = `ליד שוחזר מהארכיון עם סטטוס: ${LEAD_STATUS_DISPLAY[statusToRestore as LeadStatus] || statusToRestore}`;
      await this.addLeadActivityLog(leadId, 'שחזור מארכיון', activityDescription);
      return updatedLead;
    } catch (error: any) {
      console.error(`Error restoring lead ${leadId} from archive:`, error);
      throw new Error(error.message || `Unknown error restoring lead ${leadId}`);
    }
  }
};
