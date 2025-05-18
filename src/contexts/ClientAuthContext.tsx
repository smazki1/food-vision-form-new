
import { createContext } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

// Create a context with empty default values
export const ClientAuthContext = createContext<ClientAuthContextType>({
  clientId: null,
  authenticating: true,
  isAuthenticated: false,
  hasLinkedClientRecord: false, // Adding the missing property
});

// Export the context for use in other components
export default ClientAuthContext;
