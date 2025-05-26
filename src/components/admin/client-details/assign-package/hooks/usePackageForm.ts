import React from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@/types/client";
import { Package } from "@/types/package";
import { usePackages } from "@/hooks/usePackages";
import { assignPackageSchema } from "../schema";
import type { AssignPackageFormValues } from "../AssignPackageDialog";

export const usePackageForm = (client: Client) => {
  const { packages, isLoading } = usePackages();
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(
    null
  );

  const form = useForm<AssignPackageFormValues>({
    resolver: zodResolver(assignPackageSchema),
    defaultValues: {
      packageId: client.current_package_id || "",
      total_servings_from_package: undefined,
      servings_used_at_assignment: 0,
      initial_remaining_servings: client.remaining_servings || 0,
      paymentStatus: "unpaid",
      notes: "",
      expirationDate: undefined,
    },
  });

  const watchedPackageId = useWatch({ control: form.control, name: "packageId" });
  const watchedTotalServings = useWatch({ control: form.control, name: "total_servings_from_package" });
  const watchedServingsUsed = useWatch({ control: form.control, name: "servings_used_at_assignment" });

  React.useEffect(() => {
    if (watchedPackageId && packages.length > 0) {
      const selectedPkg = packages.find((pkg) => pkg.package_id === watchedPackageId);
      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        form.setValue("total_servings_from_package", selectedPkg.total_servings, { shouldValidate: true });
        
        if (client.current_package_id === selectedPkg.package_id && client.remaining_servings !== null && client.remaining_servings !== undefined) {
            form.setValue("initial_remaining_servings", client.remaining_servings, { shouldValidate: true });
            const used = selectedPkg.total_servings - client.remaining_servings;
            form.setValue("servings_used_at_assignment", Math.max(0, used), { shouldValidate: true });
        } else {
            form.setValue("initial_remaining_servings", selectedPkg.total_servings, { shouldValidate: true });
            form.setValue("servings_used_at_assignment", 0, { shouldValidate: true });
        }
      } else {
        setSelectedPackage(null);
        form.setValue("total_servings_from_package", undefined, { shouldValidate: true });
        form.setValue("initial_remaining_servings", 0, { shouldValidate: true });
        form.setValue("servings_used_at_assignment", 0, { shouldValidate: true });
      }
    } else if (!watchedPackageId && packages.length > 0) {
        setSelectedPackage(null);
        form.setValue("total_servings_from_package", undefined, { shouldValidate: true });
        form.setValue("initial_remaining_servings", client.remaining_servings || 0, { shouldValidate: true });
        form.setValue("servings_used_at_assignment", 0, { shouldValidate: true });
    }
  }, [watchedPackageId, packages, form, client.current_package_id, client.remaining_servings]);

  React.useEffect(() => {
    if (watchedTotalServings !== undefined && watchedServingsUsed !== undefined) {
      const total = watchedTotalServings || 0;
      const used = watchedServingsUsed || 0;
      const remaining = Math.max(0, total - used);
      if (form.getValues("initial_remaining_servings") !== remaining) {
        form.setValue("initial_remaining_servings", remaining, { shouldValidate: true });
      }
    }
  }, [watchedTotalServings, watchedServingsUsed, form]);
  
  const filteredPackages = packages.filter((pkg) => pkg.is_active || pkg.package_id === client.current_package_id);

  return { form, selectedPackage, packages: filteredPackages, isLoading };
};
