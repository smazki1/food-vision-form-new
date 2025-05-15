
import { useQuery } from "@tanstack/react-query";
import { getPackages } from "@/api/packageApi";

export const usePackages = () => {
  const { 
    data: packages = [], 
    isLoading,
    isError,
    error 
  } = useQuery({
    queryKey: ["packages"],
    queryFn: getPackages
  });

  return {
    packages,
    isLoading,
    isError,
    error
  };
};
