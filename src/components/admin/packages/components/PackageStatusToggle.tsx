
import React from "react";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { togglePackageActiveStatus } from "@/api/packageApi";
import { toast } from "sonner";

interface PackageStatusToggleProps {
  packageId: string;
  isActive: boolean;
}

const PackageStatusToggle: React.FC<PackageStatusToggleProps> = ({ packageId, isActive }) => {
  const queryClient = useQueryClient();
  
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      togglePackageActiveStatus(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("סטטוס החבילה עודכן בהצלחה");
    },
    onError: (error) => {
      toast.error("שגיאה בעדכון סטטוס החבילה");
      console.error(error);
    }
  });

  const handleToggleActive = () => {
    toggleActiveMutation.mutate({ id: packageId, isActive: !isActive });
  };

  return (
    <div className="flex items-center justify-center">
      <Switch
        checked={isActive}
        onCheckedChange={handleToggleActive}
      />
      <span className="ml-2">{isActive ? "פעילה" : "לא פעילה"}</span>
    </div>
  );
};

export default PackageStatusToggle;
