
import React from "react";
import { Lead } from "@/types/models";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LeadsTable from "@/components/admin/leads/LeadsTable";

interface LeadsContentProps {
  leads: Lead[];
  loading: boolean;
  searchTerm: string;
  activeFiltersCount: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  onSort: (field: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  onConvertToClient: (lead: Lead) => void;
}

export const LeadsContent: React.FC<LeadsContentProps> = ({
  leads,
  loading,
  searchTerm,
  activeFiltersCount,
  sortBy,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onConvertToClient,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
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
          onEdit={onEdit}
          isLoading={loading}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      </CardContent>
    </Card>
  );
};
