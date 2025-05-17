
import { useContext } from 'react';
import { ClientAuthContext } from '@/contexts/ClientAuthContext';

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  
  if (context === undefined) {
    throw new Error('[AUTH_DEBUG] useClientAuth must be used within a ClientAuthProvider');
  }
  
  return context;
};

// Re-export the ClientAuthProvider for convenience
export { ClientAuthProvider } from '@/providers/ClientAuthProvider';
