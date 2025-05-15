
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPackageName } from "@/api/clientApi";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientsPackageNameProps {
  packageId: string | null;
}

const ClientsPackageName: React.FC<ClientsPackageNameProps> = ({ packageId }) => {
  const { data: packageName, isLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: () => getPackageName(packageId),
    enabled: !!packageId,
  });

  if (isLoading) return <Skeleton className="h-5 w-24" />;
  
  return <span>{packageName || "לא מוגדר"}</span>;
};

export default ClientsPackageName;
