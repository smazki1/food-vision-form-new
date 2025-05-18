
import { createContext } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

// Create a context with empty default values
export const ClientAuthContext = createContext<ClientAuthContextType>({
  clientId: null,
  authenticating: true,
  isAuthenticated: false,
  hasLinkedClientRecord: false, // Adding the missing property
  errorState: null // Add error state for specific auth/client fetch errors
});

// Export the context for use in other components
export default ClientAuthContext;
