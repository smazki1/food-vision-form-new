import { useState, useEffect } from 'react';
import { useClientAuth } from './useClientAuth';
import { supabase } from '@/integrations/supabase/client';

export interface PackageDetails {
  remainingDishes: number;
  totalDishes: number;
  packageName: string;
}

interface ClientPackageData {
  remaining_dishes: number;
  total_dishes: number;
  package_name: string;
}

export function useClientPackage(): PackageDetails {
  const [packageDetails, setPackageDetails] = useState<PackageDetails>({
    remainingDishes: 0,
    totalDishes: 0,
    packageName: ''
  });
  const { clientId } = useClientAuth();

  useEffect(() => {
    async function fetchPackageDetails() {
      if (!clientId) return;

      const { data, error } = await supabase
        .from('client_packages')
        .select('remaining_dishes, total_dishes, package_name')
        .eq('client_id', clientId)
        .single();

      if (error) {
        console.error("[useClientPackage] Error fetching package details for clientId " + clientId + ":", error);
        return;
      }

      if (data) {
        const packageData = data as ClientPackageData;
        setPackageDetails({
          remainingDishes: packageData.remaining_dishes,
          totalDishes: packageData.total_dishes,
          packageName: packageData.package_name
        });
      }
    }

    fetchPackageDetails();
  }, [clientId]);

  return packageDetails;
} 