import React, { useState } from "react";
import { Package } from "@/types/package";
import PackagesHeader from "@/components/admin/packages/components/PackagesHeader";
import PackagesTable from "@/components/admin/packages/components/PackagesTable";
import PackagesLoadingState from "@/components/admin/packages/components/PackagesLoadingState";
import PackageFormDialog from "@/components/admin/packages/PackageFormDialog";
import { usePackages } from "@/hooks/usePackages";

const PackagesManagementPage: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  
  const { packages, isLoading } = usePackages();
  
  const handleAddClick = () => {
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (pkg: Package) => {
    setEditPackage(pkg);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditPackage(null);
  };

  if (isLoading) {
    return <PackagesLoadingState />;
  }
  
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <PackagesHeader onAddPackage={handleAddClick} />
        
        <PackagesTable 
          packages={packages}
          onEditPackage={handleEditClick}
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
