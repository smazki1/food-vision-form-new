
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Client } from "@/types/client";
import { usePackageForm } from "./hooks/usePackageForm";
import { assignPackageSchema } from "./schema";
import { PackageSelectionField } from "./components/PackageSelectionField";
import { ServingsCountField } from "./components/ServingsCountField";
import { PaymentStatusField } from "./components/PaymentStatusField";
import { ExpirationDateField } from "./components/ExpirationDateField";
import { NotesField } from "./components/NotesField";

// Type for form values
export type AssignPackageFormValues = z.infer<typeof assignPackageSchema>;

interface AssignPackageDialogProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssignPackage: (values: AssignPackageFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function AssignPackageDialog({
  client,
  open,
  onOpenChange,
  onAssignPackage,
  isSubmitting,
}: AssignPackageDialogProps) {
  const { form, selectedPackage } = usePackageForm(client);
  
  // Handle form submission
  const onSubmit = async (values: AssignPackageFormValues) => {
    await onAssignPackage(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>הקצאת חבילה</DialogTitle>
          <DialogDescription>
            ניתן להקצות חבילה חדשה או לשנות את החבילה הקיימת של הלקוח.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <PackageSelectionField selectedPackage={selectedPackage} />
            <ServingsCountField />
            <PaymentStatusField />
            <ExpirationDateField />
            <NotesField />

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "מקצה..." : "הקצה חבילה"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AssignPackageDialog;
