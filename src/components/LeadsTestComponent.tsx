
// src/pages/admin/LeadsTestPage.tsx
import React from 'react';
import { useLeads, useCreateLead, useUpdateLead, useConvertLeadToClient, useArchiveLead, useRestoreLeadFromArchive } from '@/hooks/useLeads';
import { Lead } from '@/types/models';
import { LEAD_STATUSES, LeadStatus, LEAD_SOURCE_TYPES, LeadSource } from '@/constants/statusTypes';
import { Button } from '@/components/ui/button';

const LeadsTestComponent: React.FC = () => {
  const { leads, loading, error } = useLeads({});
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const convertLeadToClientMutation = useConvertLeadToClient();
  const archiveLeadMutation = useArchiveLead();
  const restoreLeadMutation = useRestoreLeadFromArchive();

  const handleCreateTestLead = () => {
    const newLeadData: Partial<Lead> = { 
      restaurant_name: 'Test Restaurant ' + Date.now(),
      contact_name: 'Test Contact ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      lead_status: LEAD_STATUSES.NEW,
      lead_source: LEAD_SOURCE_TYPES.WEBSITE,
      phone: '1234567890',
      notes: 'Created by LeadsTestComponent',
      ai_trainings_count: 0,
      ai_training_cost_per_unit: 0,
      ai_prompts_count: 0,
      ai_prompt_cost_per_unit: 0,
      free_sample_package_active: false,
    };
    createLeadMutation.mutate(newLeadData);
  };

  const handleUpdateTestLead = (leadId: string) => {
    updateLeadMutation.mutate({ leadId: leadId, updates: { restaurant_name: 'Updated Restaurant Name ' + Date.now() } });
  };

  const handleConvertToClient = (leadId: string) => {
    const placeholderUserId = 'test-user-id'; 
    convertLeadToClientMutation.mutate({ leadId, userId: placeholderUserId });
  };

  const handleArchiveLead = (leadId: string) => {
    archiveLeadMutation.mutate(leadId);
  };
  
  const handleRestoreLead = (leadId: string) => {
    restoreLeadMutation.mutate({ leadId, newStatus: LEAD_STATUSES.NEW as LeadStatus });
  };

  if (loading) return <p>Loading leads...</p>;
  if (error) return <p>Error loading leads: {error.message}</p>;

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm bg-white">
      <h2 className="text-2xl font-semibold mb-4">Leads Test Area</h2>
      <Button onClick={handleCreateTestLead} disabled={createLeadMutation.isPending} className="mb-4">
        {createLeadMutation.isPending ? 'Creating...' : 'Create Test Lead'}
      </Button>
      {leads.length === 0 ? (
        <p>No leads found.</p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead) => (
            <li key={lead.lead_id} className="p-3 border rounded-md bg-gray-50 shadow-sm">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-lg">{lead.restaurant_name} <span className="text-sm text-gray-500">({lead.email})</span></p>
                  <p className="text-sm text-gray-600">Status: {lead.lead_status} | Source: {lead.lead_source}</p>
                  {lead.lead_status === LEAD_STATUSES.ARCHIVED && <p className="text-sm text-red-500">Archived</p>}
                </div>
                <div className="space-x-2 flex items-center">
                  <Button size="sm" variant="outline" onClick={() => handleUpdateTestLead(lead.lead_id)} disabled={updateLeadMutation.isPending && updateLeadMutation.variables?.leadId === lead.lead_id}>
                    Update
                  </Button>
                  {lead.lead_status !== LEAD_STATUSES.ARCHIVED && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleConvertToClient(lead.lead_id)} disabled={convertLeadToClientMutation.isPending && convertLeadToClientMutation.variables?.leadId === lead.lead_id}>
                        Convert
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleArchiveLead(lead.lead_id)} disabled={archiveLeadMutation.isPending && archiveLeadMutation.variables === lead.lead_id}>
                        Archive
                      </Button>
                    </>
                  )}
                  {lead.lead_status === LEAD_STATUSES.ARCHIVED && (
                     <Button size="sm" variant="outline" onClick={() => handleRestoreLead(lead.lead_id)} disabled={restoreLeadMutation.isPending && restoreLeadMutation.variables?.leadId === lead.lead_id}>
                        Restore
                      </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LeadsTestComponent;
