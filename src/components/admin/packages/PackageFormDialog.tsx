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
  FeaturesTagsField,
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "עריכת חבילה" : "יצירת חבילה חדשה"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "ערוך את פרטי החבילה וההגדרות שלה" : "צור חבילה חדשה עם כל הפרטים והמגבלות הרלוונטיות"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Fields */}
            <BasicPackageFields />
            
            {/* Numeric Fields */}
            <NumericPackageFields />
            
            {/* Limits Fields */}
            <LimitsPackageFields />
            
            {/* Features Tags Field */}
            <FeaturesTagsField />
            
            {/* Status Field */}
            <StatusField />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="ml-2">
                בטל
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEditMode ? "שמור שינויים" : "צור חבילה"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageFormDialog;
