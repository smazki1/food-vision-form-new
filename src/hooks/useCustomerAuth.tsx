
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useCustomerAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('[AUTH_DEBUG] useCustomerAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Re-export the AuthProvider for convenience
export { AuthProvider } from '@/providers/AuthProvider';
