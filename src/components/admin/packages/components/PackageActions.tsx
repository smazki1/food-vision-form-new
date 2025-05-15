
import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { Package } from "@/types/package";

interface PackageActionsProps {
  pkg: Package;
  onEditClick: (pkg: Package) => void;
}

const PackageActions: React.FC<PackageActionsProps> = ({ pkg, onEditClick }) => {
  return (
    <div className="flex justify-center space-x-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEditClick(pkg)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PackageActions;
