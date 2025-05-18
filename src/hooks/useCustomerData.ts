import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
import { ServicePackage } from '@/types/package';
import { CustomerSubmission } from '@/types/submission';

export const useCustomerData = () => {
  // Fetch customer profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['customerProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_auth_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching client profile:', error);
        throw error;
      }

      return client as Client;
    },
  });

  // Fetch current package if client has one
  const { data: currentPackage, isLoading: isLoadingPackage } = useQuery({
    queryKey: ['customerPackage', profile?.current_package_id],
    queryFn: async () => {
      if (!profile?.current_package_id) return null;

      const { data: package_, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('package_id', profile.current_package_id)
        .single();

      if (error) {
        console.error('Error fetching current package:', error);
        throw error;
      }

      return package_ as ServicePackage;
    },
    enabled: !!profile?.current_package_id,
  });

  // Fetch customer submissions
  const { data: submissions = [], isLoading: isLoadingSubmissions } = useQuery({
    queryKey: ['customerSubmissions', profile?.client_id],
    queryFn: async () => {
      if (!profile?.client_id) return [];

      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          *,
          service_packages:assigned_package_id_at_submission(
            package_name
          )
        `)
        .eq('client_id', profile.client_id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching customer submissions:', error);
        throw error;
      }

      return data as CustomerSubmission[];
    },
    enabled: !!profile?.client_id,
  });

  return {
    profile,
    currentPackage,
    submissions,
    isLoading: isLoadingProfile || isLoadingPackage || isLoadingSubmissions,
  };
}; 