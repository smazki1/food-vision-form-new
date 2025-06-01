import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import LeadForm from "@/components/admin/leads/LeadForm";
import { Lead } from "@/types/models";

interface LeadFormSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const LeadFormSheet: React.FC<LeadFormSheetProps> = ({
  isOpen,
  onOpenChange,
  lead,
  onSubmit,
  onCancel,
  isLoading
}) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {lead ? "עריכת ליד" : "יצירת ליד חדש"}
          </SheetTitle>
        </SheetHeader>
        <div className="py-6">
          <LeadForm
            lead={lead}
            onSubmit={onSubmit}
            onCancel={onCancel}
            isLoading={isLoading}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
