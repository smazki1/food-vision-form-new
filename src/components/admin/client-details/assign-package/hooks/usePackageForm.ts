
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client } from "@/types/client";
import { Package } from "@/types/package";
import { usePackages } from "@/hooks/usePackages";
import { assignPackageSchema } from "../schema";
import type { AssignPackageFormValues } from "../AssignPackageDialog";

export const usePackageForm = (client: Client) => {
  const { packages, isLoading } = usePackages();
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);

  // Initialize form with default values
  const form = useForm<AssignPackageFormValues>({
    resolver: zodResolver(assignPackageSchema),
    defaultValues: {
      packageId: client.current_package_id || "",
      servingsCount: client.remaining_servings || 0,
      paymentStatus: "unpaid",
      notes: "",
    },
  });

  // Update servings count when package selection changes
  React.useEffect(() => {
    const packageId = form.getValues("packageId");
    if (packageId) {
      const selectedPkg = packages.find((pkg) => pkg.package_id === packageId);
      if (selectedPkg) {
        setSelectedPackage(selectedPkg);
        form.setValue("servingsCount", selectedPkg.total_servings);
      }
    }
  }, [packages, form]);

  const filteredPackages = packages.filter((pkg) => pkg.is_active);

  return { form, selectedPackage, packages: filteredPackages, isLoading };
};
