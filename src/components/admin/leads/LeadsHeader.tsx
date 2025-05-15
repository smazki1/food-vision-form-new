
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeadsHeaderProps {
  onCreateLead: () => void;
}

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  onCreateLead,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <h1 className="text-3xl font-bold tracking-tight">ניהול לידים</h1>
      <Button onClick={onCreateLead}>
        <Plus className="mr-2 h-4 w-4" /> ליד חדש
      </Button>
    </div>
  );
};
