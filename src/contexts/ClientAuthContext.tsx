import { createContext } from 'react';
import { ClientAuthContextType } from '@/types/clientAuthTypes';

// Create a context with empty default values
export const ClientAuthContext = createContext<ClientAuthContextType>({
  clientId: null,
  userAuthId: null,
  authenticating: true,
  isAuthenticated: false,
  hasLinkedClientRecord: false,
  hasNoClientRecord: false, // Added new property
  clientRecordStatus: 'loading', // Added new property
  errorState: null,
  refreshClientAuth: () => {} // Add default empty function
});

// Export the context for use in other components
export default ClientAuthContext;
