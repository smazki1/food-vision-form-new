
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPackages, togglePackageActiveStatus } from "@/api/packageApi";
import { Package } from "@/types/package";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import PackageFormDialog from "@/components/admin/packages/PackageFormDialog";

const PackagesManagementPage: React.FC = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editPackage, setEditPackage] = useState<Package | null>(null);
  
  const queryClient = useQueryClient();
  
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: getPackages
  });
  
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

  const handleToggleActive = (packageId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id: packageId, isActive: !currentStatus });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleEditClick = (pkg: Package) => {
    setEditPackage(pkg);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditPackage(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">ניהול חבילות</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="ml-2 h-4 w-4" />
          הוסף חבילה חדשה
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם חבילה</TableHead>
              <TableHead className="text-center">מספר מנות</TableHead>
              <TableHead className="text-center">מחיר</TableHead>
              <TableHead className="text-center">תכונות</TableHead>
              <TableHead className="text-center">סטטוס</TableHead>
              <TableHead className="text-center">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  לא נמצאו חבילות
                </TableCell>
              </TableRow>
            ) : (
              packages.map((pkg) => (
                <TableRow key={pkg.package_id}>
                  <TableCell className="font-medium">{pkg.package_name}</TableCell>
                  <TableCell className="text-center">{pkg.total_servings}</TableCell>
                  <TableCell className="text-center">{formatPrice(pkg.price)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {pkg.features_tags?.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={() => handleToggleActive(pkg.package_id, pkg.is_active)}
                      />
                      <span className="ml-2">{pkg.is_active ? "פעילה" : "לא פעילה"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(pkg)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {(isAddDialogOpen || editPackage) && (
        <PackageFormDialog
          open={isAddDialogOpen || !!editPackage}
          onClose={handleCloseDialog}
          packageToEdit={editPackage}
        />
      )}
    </div>
  );
};

export default PackagesManagementPage;
