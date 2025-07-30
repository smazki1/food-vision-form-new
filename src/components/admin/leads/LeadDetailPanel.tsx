import React from 'react';
import { LeadDetailsSheet } from './LeadDetailsSheet';
import { useLeadById } from '@/hooks/useEnhancedLeads';
import { Lead } from '@/types/models';

interface LeadDetailPanelProps {
  leadId: string;
  onClose: () => void;
  isArchiveView?: boolean;
}

export function LeadDetailPanel({ leadId, onClose, isArchiveView }: LeadDetailPanelProps) {
  const { data: lead, isLoading } = useLeadById(leadId);

  const handleSave = async (leadData: Partial<Lead>) => {
    // For now, just close the panel - saving will be handled by the sheet component
    console.log('Lead data to save:', leadData);
  };

  if (isLoading) {
    return <div className="p-4">Loading lead details...</div>;
  }

  return (
    <LeadDetailsSheet
      lead={lead || null}
      isOpen={true}
      onClose={onClose}
      onSave={handleSave}
    />
  );
} 