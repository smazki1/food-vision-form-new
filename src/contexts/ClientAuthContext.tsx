
import { createContext } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

// Create a context with empty default values
export const ClientAuthContext = createContext<ClientAuthContextType>({
  clientId: null,
  authenticating: true,
  isAuthenticated: false,
});

// Export the context for use in other components
export default ClientAuthContext;
