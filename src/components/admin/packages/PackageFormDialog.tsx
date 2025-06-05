import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Package } from "@/types/package";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { 
  BasicPackageFields, 
  NumericPackageFields,
  LimitsPackageFields,
  SpecialNotesField,
  TotalImagesField,
  StatusField 
} from "./components/PackageFormFields";
import { packageFormSchema, usePackageForm } from "./hooks/usePackageForm";
import type { PackageFormValues } from "./hooks/usePackageForm";

interface PackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  packageToEdit: Package | null;
}

const PackageFormDialog: React.FC<PackageFormDialogProps> = ({ open, onClose, packageToEdit }) => {
  const { 
    isEditMode, 
    isPending, 
    handleSubmit, 
    defaultValues 
  } = usePackageForm(packageToEdit, onClose);
  
  // Define form with proper type casting
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues
  });
  
  const onSubmit = (data: PackageFormValues) => {
    handleSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{isEditMode ? "עריכת חבילה" : "יצירת חבילה חדשה"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "ערוך את פרטי החבילה וההגדרות שלה" : "צור חבילה חדשה עם כל הפרטים והמגבלות הרלוונטיות"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
              {/* Basic Fields */}
              <BasicPackageFields />
              
              {/* Numeric Fields */}
              <NumericPackageFields />
              
              {/* Limits Fields */}
              <LimitsPackageFields />
              
              {/* Special Notes Field */}
              <SpecialNotesField />
              
              {/* Total Images Field */}
              <TotalImagesField />
              
              {/* Status Field */}
              <StatusField />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="ml-2">
                  בטל
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isEditMode ? "שמור שינויים" : "צור חבילה"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PackageFormDialog;
