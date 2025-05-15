
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPackageById } from "@/api/packageApi";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsPackageNameProps {
  packageId: string | null;
}

const ClientsPackageName: React.FC<ClientsPackageNameProps> = ({ packageId }) => {
  const { data: packageData, isLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => getPackageById(packageId as string),
    enabled: !!packageId,
  });

  if (isLoading) return <Skeleton className="h-5 w-24" />;
  
  return <span>{packageData?.package_name || "לא מוגדר"}</span>;
};

export default ClientsPackageName;
