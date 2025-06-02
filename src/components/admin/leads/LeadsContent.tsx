import React from "react";
import { Lead } from "@/types/lead";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LeadsTable from "@/components/admin/leads/LeadsTable";
import { useTranslation } from "react-i18next";
import { Spinner } from "@/components/ui/spinner";

interface LeadsContentProps {
  leads: Lead[];
  loading: boolean;
  error: Error | null;
  searchTerm: string;
  activeFiltersCount: number;
  currentSort: { field: keyof Lead | 'actions' | 'select'; direction: 'asc' | 'desc' } | null;
  onSort: (field: keyof Lead | 'actions' | 'select') => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (id: string) => void;
  onViewLead: (lead: Lead) => void;
  onConvertToClient: (lead: Lead) => void;
  selectedLeads: Set<string>;
  onSelectLead: (leadId: string) => void;
  onSelectAllLeads: (selectAll: boolean) => void;
  isArchiveView?: boolean;
}

export const LeadsContent: React.FC<LeadsContentProps> = ({
  leads = [],
  loading,
  error,
  searchTerm,
  activeFiltersCount,
  currentSort,
  onSort,
  onEditLead,
  onDeleteLead,
  onViewLead,
  onConvertToClient,
  selectedLeads,
  onSelectLead,
  onSelectAllLeads,
  isArchiveView = false,
}) => {
  const { t } = useTranslation();

  if (error) {
    return <div className="p-4 text-center text-red-500">Error loading leads: {error.message}</div>;
  }

  if (loading && leads.length === 0) {
    return (
      <div className="flex justify-center items-center p-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!loading && leads.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>
          {isArchiveView ? t('leadsPage.noLeadsFoundInArchive') : t('leadsPage.noLeadsFound')}
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>לידים</CardTitle>
        <CardDescription>
          רשימת כל הלידים במערכת {searchTerm || activeFiltersCount > 0 ? `(${leads.length} תוצאות)` : `(${leads.length})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LeadsTable
          leads={leads}
          isLoading={loading}
          error={error}
          currentSort={currentSort}
          onSort={onSort}
          selectedLeads={selectedLeads}
          onSelectLead={onSelectLead}
          onSelectAllLeads={onSelectAllLeads}
          onViewLead={onViewLead}
          onEditLead={onEditLead}
          onDeleteLead={onDeleteLead}
        />
      </CardContent>
    </Card>
  );
};
