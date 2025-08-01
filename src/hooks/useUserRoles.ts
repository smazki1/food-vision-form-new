import { useQuery } from '@tanstack/react-query';
  
  // Fetch all users with their roles
export const useUserRoles = () => {
  return useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      console.log('[USER_ROLES] Admin functionality disabled for security');
      // Return empty data since admin functionality has been moved to edge functions
      return [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
};
  
// Assign role to user - disabled for security
export const useAssignRole = () => {
  return {
    mutate: () => {
      console.warn('Role assignment disabled for security - use admin edge functions');
    },
    isPending: false
  };
};
  
// Remove role from user - disabled for security
export const useRemoveRole = () => {
  return {
    mutate: () => {
      console.warn('Role removal disabled for security - use admin edge functions');
    },
    isPending: false
  };
};
