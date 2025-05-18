
import { useContext } from 'react';
import { UnifiedAuthContext } from '@/contexts/UnifiedAuthContext';
import { UnifiedAuthContextType } from '@/types/unifiedAuthTypes';

/**
 * Primary hook to access unified authentication state and methods
 */
export const useUnifiedAuth = (): UnifiedAuthContextType => {
  const context = useContext(UnifiedAuthContext);
  
  if (context === undefined) {
    throw new Error('useUnifiedAuth must be used within a UnifiedAuthProvider');
  }
  
  return context;
};

/**
 * Hook to check if the user has a specific role
 */
export const useHasRole = (role: 'admin' | 'editor' | 'customer' | (string & {})): boolean => {
  const { role: userRole } = useUnifiedAuth();
  return userRole === role;
};

/**
 * Hook to check if the user is a customer
 */
export const useIsCustomer = (): boolean => {
  const { role } = useUnifiedAuth();
  return role === 'customer';
};

/**
 * Hook to check if the user is an admin
 */
export const useIsAdmin = (): boolean => {
  const { role } = useUnifiedAuth();
  return role === 'admin';
};

/**
 * Hook to check if the user is an editor
 */
export const useIsEditor = (): boolean => {
  const { role } = useUnifiedAuth();
  return role === 'editor';
};

/**
 * Hook to check if the user is any kind of staff (admin or editor)
 */
export const useIsStaff = (): boolean => {
  const { role } = useUnifiedAuth();
  return role === 'admin' || role === 'editor';
};

// Re-export the provider for convenience
export { UnifiedAuthProvider } from '@/providers/UnifiedAuthProvider';
