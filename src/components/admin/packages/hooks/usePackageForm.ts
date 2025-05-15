
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPackage, updatePackage } from "@/api/packageApi";
import { Package } from "@/types/package";
import { toast } from "sonner";

// Schema definition moved to the hook for reuse
export const packageFormSchema = z.object({
  package_name: z.string().min(1, { message: "שם חבילה הוא שדה חובה" }),
  description: z.string().optional(),
  total_servings: z.coerce.number().int().min(0, { message: "מספר מנות חייב להיות 0 או יותר" }),
  price: z.coerce.number().min(0, { message: "מחיר חייב להיות 0 או יותר" }),
  is_active: z.boolean().default(true),
  max_processing_time_days: z.coerce.number().int().min(1).optional().nullable(),
  features_tags: z.string().optional(),
  max_edits_per_serving: z.coerce.number().int().min(1, { message: "מספר עריכות מקסימלי חייב להיות 1 או יותר" })
});

export type PackageFormValues = z.infer<typeof packageFormSchema>;

// Utility function to convert form values to API data
export const formValuesToApiData = (data: PackageFormValues) => {
  return {
    package_name: data.package_name,
    description: data.description,
    total_servings: data.total_servings,
    price: data.price,
    is_active: data.is_active,
    max_edits_per_serving: data.max_edits_per_serving,
    max_processing_time_days: data.max_processing_time_days || undefined,
    features_tags: data.features_tags ? 
      data.features_tags.split(",").map(tag => tag.trim()).filter(Boolean) : []
  };
};

// Utility function to prepare default values from existing package
export const packageToDefaultValues = (packageToEdit: Package | null): PackageFormValues => {
  if (!packageToEdit) {
    return {
      package_name: "",
      description: "",
      total_servings: 0,
      price: 0,
      is_active: true,
      max_edits_per_serving: 1,
      max_processing_time_days: null,
      features_tags: ""
    };
  }

  return {
    package_name: packageToEdit.package_name,
    description: packageToEdit.description || "",
    total_servings: packageToEdit.total_servings,
    price: packageToEdit.price,
    is_active: packageToEdit.is_active,
    max_edits_per_serving: packageToEdit.max_edits_per_serving,
    max_processing_time_days: packageToEdit.max_processing_time_days || null,
    features_tags: packageToEdit.features_tags ? packageToEdit.features_tags.join(", ") : ""
  };
};

export const usePackageForm = (packageToEdit: Package | null, onSuccess: () => void) => {
  const queryClient = useQueryClient();
  const isEditMode = !!packageToEdit;

  const createMutation = useMutation({
    mutationFn: (data: PackageFormValues) => createPackage(formValuesToApiData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("החבילה נוצרה בהצלחה");
      onSuccess();
    },
    onError: (error) => {
      toast.error("שגיאה ביצירת החבילה");
      console.error(error);
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: (data: PackageFormValues) => {
      if (!packageToEdit) throw new Error("No package to edit");
      return updatePackage(packageToEdit.package_id, formValuesToApiData(data));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("החבילה עודכנה בהצלחה");
      onSuccess();
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון החבילה");
      console.error(error);
    }
  });

  const handleSubmit = (data: PackageFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return {
    isEditMode,
    isPending: createMutation.isPending || updateMutation.isPending,
    handleSubmit,
    defaultValues: packageToDefaultValues(packageToEdit)
  };
};
