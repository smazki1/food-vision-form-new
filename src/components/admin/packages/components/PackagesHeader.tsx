
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface PackagesHeaderProps {
  onAddPackage: () => void;
}

const PackagesHeader: React.FC<PackagesHeaderProps> = ({ onAddPackage }) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold tracking-tight">ניהול חבילות</h1>
      <Button onClick={onAddPackage}>
        <Plus className="ml-2 h-4 w-4" />
        הוסף חבילה חדשה
      </Button>
    </div>
  );
};

export default PackagesHeader;
