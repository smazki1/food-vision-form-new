
import { useState, useEffect } from 'react';
import { useClientAuth } from './useClientAuth';
import { useUnifiedAuth } from './useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';

export interface PackageDetails {
  remainingDishes: number;
  totalDishes: number;
  packageName: string;
}

interface ClientData {
  remaining_servings: number;
  service_packages?: {
    package_name: string;
    total_servings: number;
  }[] | null;
}

export function useClientPackage(): PackageDetails {
  const [packageDetails, setPackageDetails] = useState<PackageDetails>({
    remainingDishes: 0,
    totalDishes: 0,
    packageName: ''
  });
  
  const { clientId: clientAuthId } = useClientAuth();
  const { clientId: unifiedClientId } = useUnifiedAuth();
  
  // Use clientId from either source
  const clientId = clientAuthId || unifiedClientId;

  useEffect(() => {
    async function fetchPackageDetails() {
      if (!clientId) {
        console.log("[useClientPackage] No clientId available");
        return;
      }

      console.log("[useClientPackage] Fetching package details for clientId:", clientId);

      try {
        // First try to get client data with package info
        const { data: clientWithPackage, error: clientError } = await supabase
          .from('clients')
          .select(`
            remaining_servings,
            current_package_id,
            service_packages!inner (
              package_name,
              total_servings
            )
          `)
          .eq('client_id', clientId)
          .single();

        console.log("[useClientPackage] Client with package query result:", { clientWithPackage, clientError });

        if (clientError) {
          console.error("[useClientPackage] Error fetching client with package:", clientError);
          
          // Fallback: try to get basic client data
          const { data: basicClient, error: basicError } = await supabase
            .from('clients')
            .select('remaining_servings')
            .eq('client_id', clientId)
            .single();
            
          console.log("[useClientPackage] Basic client fallback:", { basicClient, basicError });
          
          if (basicClient) {
            setPackageDetails({
              remainingDishes: basicClient.remaining_servings,
              totalDishes: 0,
              packageName: 'חבילה לא זמינה'
            });
          }
          return;
        }

        if (clientWithPackage) {
          const data = clientWithPackage as ClientData;
          // Since we're using inner join, service_packages should be an array with at least one item
          const packageInfo = data.service_packages?.[0];
          setPackageDetails({
            remainingDishes: data.remaining_servings,
            totalDishes: packageInfo?.total_servings || 0,
            packageName: packageInfo?.package_name || 'חבילה לא זמינה'
          });
        }
      } catch (err) {
        console.error("[useClientPackage] Exception fetching package details:", err);
      }
    }

    fetchPackageDetails();
  }, [clientId]);

  return packageDetails;
}
