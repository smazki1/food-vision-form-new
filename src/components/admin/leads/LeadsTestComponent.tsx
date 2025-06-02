import React, { useState } from 'react';
import { useLeads, useCreateLead, useUpdateLead } from '@/hooks/useLeads';
import { Lead as ModelsLead, LeadStatus } from '@/types/models';
import { LEAD_STATUSES, LEAD_STATUS_DISPLAY } from '@/constants/statusTypes';

// const LEAD_STATUS_COLORS: { [key: string]: string } = { ... }; // Removed this old placeholder

const LeadsTestComponent: React.FC = () => {
  const [newLead, setNewLead] = useState({
    restaurant_name: '',
    contact_name: '',
    phone: '',
    email: '',
  });
  
  // Make sure useLeads returns an object with a data property
  const { data: leads = [], isLoading, error } = useLeads() as { data: ModelsLead[], isLoading: boolean, error: Error | null };
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure newLead has all required fields for createLead or handle optional fields
    createLeadMutation.mutate(newLead as Partial<ModelsLead>); 
  };
  
  const handleUpdateStatus = (leadId: string, status: string) => {
    if (!leadId) {
      console.error("leadId is undefined, cannot update status.");
      return;
    }
    updateLeadMutation.mutate({ 
      leadId, 
      updates: { lead_status: status as LeadStatus } // Cast status to LeadStatus if sure it's compatible
    });
  };
  
  if (isLoading) return <div className="text-center p-4">Loading leads...</div>;
  if (error) return <div className="text-center p-4 text-red-500">Error loading leads: {error.message}</div>;
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Leads Test Component</h1>
      
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-lg mb-10">
        <h2 className="text-xl font-semibold mb-6 text-gray-700">Add New Lead</h2>
        <div className="space-y-4">
          <input
            className="p-3 border rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Restaurant Name"
            value={newLead.restaurant_name}
            onChange={e => setNewLead({...newLead, restaurant_name: e.target.value})}
            required
          />
          <input
            className="p-3 border rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Contact Name"
            value={newLead.contact_name}
            onChange={e => setNewLead({...newLead, contact_name: e.target.value})}
            required
          />
          <input
            className="p-3 border rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Phone"
            type="tel"
            value={newLead.phone}
            onChange={e => setNewLead({...newLead, phone: e.target.value})}
            required
          />
          <input
            className="p-3 border rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Email"
            type="email"
            value={newLead.email}
            onChange={e => setNewLead({...newLead, email: e.target.value})}
            required
          />
        </div>
        <button 
          type="submit" 
          className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          disabled={createLeadMutation.isPending}
        >
          {createLeadMutation.isPending ? 'Creating Lead...' : 'Create Lead'}
        </button>
      </form>
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <h2 className="text-xl font-semibold p-6 text-gray-700">Current Leads</h2>
        {leads.length === 0 && !isLoading ? (
          <p className="p-6 text-center text-gray-500">No leads found. Create one above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Restaurant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Change Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map(lead => (
                  <tr key={lead.lead_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lead.restaurant_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{lead.contact_name}</div>
                      <div className="text-xs text-gray-500">{lead.email} | {lead.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {lead.lead_status || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <select
                        className="p-2 border rounded-md mr-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={lead.lead_status || ''} // Ensure value is controlled
                        onChange={e => handleUpdateStatus(lead.lead_id!, e.target.value)} // Added ! assuming lead_id is always present for existing leads
                        disabled={updateLeadMutation.isPending}
                      >
                        {Object.values(LEAD_STATUSES).map(statusValue => (
                          <option key={statusValue} value={statusValue}>
                            {statusValue} {/* Consider using LEAD_STATUS_DISPLAY here if available */}
                          </option>
                        ))}
                      </select>
                      {/* The button to update was removed as select's onChange handles it */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsTestComponent; 