
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Package } from "@/types/package";
import PackageActions from "./PackageActions";
import PackageStatusToggle from "./PackageStatusToggle";

interface PackagesTableProps {
  packages: Package[];
  onEditPackage: (pkg: Package) => void;
}

const PackagesTable: React.FC<PackagesTableProps> = ({ packages, onEditPackage }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (packages.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">לא נמצאו חבילות</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>שם חבילה</TableHead>
            <TableHead className="text-center">מספר מנות</TableHead>
            <TableHead className="text-center">מחיר</TableHead>
            <TableHead className="text-center">מספר תמונות</TableHead>
            <TableHead className="text-center">הערות מיוחדות</TableHead>
            <TableHead className="text-center">סטטוס</TableHead>
            <TableHead className="text-center">פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.package_id}>
              <TableCell className="font-medium">{pkg.package_name}</TableCell>
              <TableCell className="text-center">{pkg.total_servings}</TableCell>
              <TableCell className="text-center">{formatPrice(pkg.price)}</TableCell>
              <TableCell className="text-center">{pkg.total_images || '-'}</TableCell>
              <TableCell className="text-center">{pkg.special_notes ? (pkg.special_notes.length > 30 ? pkg.special_notes.substring(0, 30) + '...' : pkg.special_notes) : '-'}</TableCell>
              <TableCell className="text-center">
                <PackageStatusToggle 
                  packageId={pkg.package_id} 
                  isActive={pkg.is_active} 
                />
              </TableCell>
              <TableCell>
                <PackageActions 
                  pkg={pkg} 
                  onEditClick={onEditPackage} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PackagesTable;
