import React, { useState } from "react";
import { Package } from "@/types/package";
import PackagesHeader from "@/components/admin/packages/components/PackagesHeader";
import PackagesTable from "@/components/admin/packages/components/PackagesTable";
import PackagesLoadingState from "@/components/admin/packages/components/PackagesLoadingState";
import PackageFormDialog from "@/components/admin/packages/PackageFormDialog";
import { usePackages_Simplified } from "@/hooks/usePackages";
import { deletePackage } from "@/api/packageApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Info } from "lucide-react";

const PackagesManagementPage: React.FC = () => {
  console.log("**************** HELLO FROM PackagesManagementPage COMPONENT TOP ****************");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  const queryClient = useQueryClient();
  
  const { 
    packages, 
    isLoading, 
    error, 
    hasAdminAccess, 
    isQueryEnabled,
    queryStatus,
    isFetching 
  } = usePackages_Simplified();
  
  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (pkg: Package) => {
    setEditPackage(pkg);
  };

  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      // Clear all package-related data from cache
      queryClient.removeQueries({ predicate: (query) => 
        query.queryKey[0] === 'packages' || query.queryKey[0] === 'packages_simplified'
      });
      // Force immediate refetch
      queryClient.refetchQueries({ predicate: (query) => 
        query.queryKey[0] === 'packages_simplified'
      });
      toast.success('החבילה נמחקה בהצלחה');
    },
    onError: (error) => {
      console.error('Error deleting package:', error);
      toast.error('שגיאה במחיקת החבילה');
    },
  });

  const handleDeleteClick = (pkg: Package) => {
    deleteMutation.mutate(pkg.package_id);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditPackage(null);
  };

  console.log('[PackagesManagementPage] State:', {
    packagesCount: packages?.length || 0,
    isLoading,
    error: error?.message,
    hasAdminAccess,
    isQueryEnabled,
    queryStatus
  });

  // Show loading if we don't have admin access yet
  if (!hasAdminAccess) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 text-center">
        <PackagesLoadingState />
        <p className="mt-4 text-gray-600">מאמת הרשאות אדמין...</p>
      </div>
    );
  }

  // Show loading for packages
  if (isLoading || (isFetching && queryStatus !== 'success')) {
    return <PackagesLoadingState />;
  }

  // Show error state
  if (error) {
    console.error("Error loading packages:", error);
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-semibold text-red-700">Failed to Load Packages</h2>
        <p className="mt-2 text-gray-600">
          There was an issue fetching the package data. Please try again later or contact support.
        </p>
        {error && (
          <p className="mt-1 text-sm text-gray-500">
            Error details: {error instanceof Error ? error.message : String(error)}
          </p>
        )}
      </div>
    );
  }
  
  // Show empty state
  if (!packages || packages.length === 0) {
    return (
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <PackagesHeader onAddPackage={handleAddClick} />
          <div className="text-center py-10">
            <Info className="mx-auto h-12 w-12 text-blue-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-700">No Packages Found</h2>
            <p className="mt-2 text-gray-600">
              There are currently no packages configured in the system. You can add a new package using the button above.
            </p>
          </div>
          {(isAddDialogOpen || editPackage) && (
            <PackageFormDialog
              open={isAddDialogOpen || !!editPackage}
              onClose={handleCloseDialog}
              packageToEdit={editPackage}
            />
          )}
        </div>
      </div>
    );
  }
  
  // Show packages table
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <PackagesHeader onAddPackage={handleAddClick} />
        
        <PackagesTable 
          packages={packages}
          onEditPackage={handleEditClick}
          onDeletePackage={handleDeleteClick}
          deletingPackageId={deleteMutation.isPending ? deleteMutation.variables : null}
        />
        
        {(isAddDialogOpen || editPackage) && (
          <PackageFormDialog
            open={isAddDialogOpen || !!editPackage}
            onClose={handleCloseDialog}
            packageToEdit={editPackage}
          />
        )}
      </div>
    </div>
  );
};

export default PackagesManagementPage;
