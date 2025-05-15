import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPackage, updatePackage } from "@/api/packageApi";
import { Package } from "@/types/package";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface PackageFormDialogProps {
  open: boolean;
  onClose: () => void;
  packageToEdit: Package | null;
}

const packageFormSchema = z.object({
  package_name: z.string().min(1, { message: "שם חבילה הוא שדה חובה" }),
  description: z.string().optional(),
  total_servings: z.coerce.number().int().min(0, { message: "מספר מנות חייב להיות 0 או יותר" }),
  price: z.coerce.number().min(0, { message: "מחיר חייב להיות 0 או יותר" }),
  is_active: z.boolean().default(true),
  max_processing_time_days: z.coerce.number().int().min(1).optional().nullable(),
  features_tags: z.string().transform(val => val.split(",").map(tag => tag.trim()).filter(Boolean)).optional(),
  max_edits_per_serving: z.coerce.number().int().min(1, { message: "מספר עריכות מקסימלי חייב להיות 1 או יותר" })
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

const PackageFormDialog: React.FC<PackageFormDialogProps> = ({ open, onClose, packageToEdit }) => {
  const isEditMode = !!packageToEdit;
  const queryClient = useQueryClient();
  
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: isEditMode ? {
      package_name: packageToEdit.package_name,
      description: packageToEdit.description || "",
      total_servings: packageToEdit.total_servings,
      price: packageToEdit.price,
      is_active: packageToEdit.is_active,
      max_edits_per_serving: packageToEdit.max_edits_per_serving,
      max_processing_time_days: packageToEdit.max_processing_time_days || null,
      features_tags: packageToEdit.features_tags?.join(", ") || ""
    } : {
      package_name: "",
      description: "",
      total_servings: 0,
      price: 0,
      is_active: true,
      max_edits_per_serving: 1,
      max_processing_time_days: null,
      features_tags: ""
    }
  });
  
  const createMutation = useMutation({
    mutationFn: (data: PackageFormValues) => {
      // Convert form data to match the Package type
      const packageData: Omit<Package, "created_at" | "package_id" | "updated_at"> = {
        package_name: data.package_name,
        description: data.description,
        total_servings: data.total_servings,
        price: data.price,
        is_active: data.is_active,
        max_edits_per_serving: data.max_edits_per_serving,
        max_processing_time_days: data.max_processing_time_days || undefined,
        features_tags: data.features_tags as unknown as string[] || []
      };
      
      return createPackage(packageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("החבילה נוצרה בהצלחה");
      onClose();
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת החבילה");
      console.error(error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: PackageFormValues) => {
      if (!packageToEdit) throw new Error("No package to edit");
      
      // Convert form data to match the Package type
      const packageData: Partial<Package> = {
        package_name: data.package_name,
        description: data.description,
        total_servings: data.total_servings,
        price: data.price,
        is_active: data.is_active,
        max_edits_per_serving: data.max_edits_per_serving,
        max_processing_time_days: data.max_processing_time_days || undefined,
        features_tags: data.features_tags as unknown as string[] || []
      };
      
      return updatePackage(packageToEdit.package_id, packageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("החבילה עודכנה בהצלחה");
      onClose();
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון החבילה");
      console.error(error);
    }
  });
  
  const onSubmit = (data: PackageFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "עריכת חבילה" : "יצירת חבילה חדשה"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="package_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם חבילה</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תיאור</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_servings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר מנות</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_edits_per_serving"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מספר עריכות מקסימלי למנה</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="max_processing_time_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>זמן טיפול מקסימלי (ימים)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        {...field}
                        value={field.value === null ? "" : field.value}
                        onChange={(e) => field.onChange(e.target.value === "" ? null : parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="features_tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תגי תכונות</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>הפרד תגים באמצעות פסיקים (לדוגמא: "מהירות, איכות גבוהה, עדיפות")</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">סטטוס פעיל</FormLabel>
                    <FormDescription>
                      חבילה פעילה זמינה להצעה ללקוחות חדשים
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="ml-2">
                בטל
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
