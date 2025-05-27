
import { useState, useEffect } from 'react';
import { useClientAuth } from './useClientAuth';
import { useUnifiedAuth } from './useUnifiedAuth';
import { supabase } from '@/integrations/supabase/client';

export interface PackageDetails {
  remainingDishes: number;
  totalDishes: number;
  packageName: string;
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
        // Get client data with package info using a more explicit query
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select(`
            remaining_servings,
            current_package_id,
            restaurant_name
          `)
          .eq('client_id', clientId)
          .single();

        console.log("[useClientPackage] Client data query result:", { clientData, clientError });

        if (clientError || !clientData) {
          console.error("[useClientPackage] Error fetching client data:", clientError);
          setPackageDetails({
            remainingDishes: 0,
            totalDishes: 0,
            packageName: 'שגיאה בטעינת נתונים'
          });
          return;
        }

        // If no package is assigned
        if (!clientData.current_package_id) {
          console.log("[useClientPackage] No package assigned to client");
          setPackageDetails({
            remainingDishes: clientData.remaining_servings || 0,
            totalDishes: 0,
            packageName: 'אין חבילה פעילה'
          });
          return;
        }

        // Now fetch the package details separately
        const { data: packageData, error: packageError } = await supabase
          .from('service_packages')
          .select(`
            package_name,
            total_servings
          `)
          .eq('package_id', clientData.current_package_id)
          .single();

        console.log("[useClientPackage] Package data query result:", { packageData, packageError });

        if (packageError || !packageData) {
          console.error("[useClientPackage] Error fetching package data:", packageError);
          setPackageDetails({
            remainingDishes: clientData.remaining_servings || 0,
            totalDishes: 0,
            packageName: 'חבילה לא נמצאה'
          });
          return;
        }

        // Success - set the complete package details
        setPackageDetails({
          remainingDishes: clientData.remaining_servings || 0,
          totalDishes: packageData.total_servings || 0,
          packageName: packageData.package_name || 'חבילה ללא שם'
        });

        console.log("[useClientPackage] Successfully set package details:", {
          remainingDishes: clientData.remaining_servings,
          totalDishes: packageData.total_servings,
          packageName: packageData.package_name
        });

      } catch (err) {
        console.error("[useClientPackage] Exception fetching package details:", err);
        setPackageDetails({
          remainingDishes: 0,
          totalDishes: 0,
          packageName: 'שגיאה לא צפויה'
        });
      }
    }

    fetchPackageDetails();
  }, [clientId]);

  return packageDetails;
}
