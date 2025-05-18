
import { createContext } from 'react';
import { UnifiedAuthContextType } from '@/types/unifiedAuthTypes';

// Create context with default values
export const UnifiedAuthContext = createContext<UnifiedAuthContextType>({
  // Basic auth
  user: null,
  session: null,
  loading: true,
  initialized: false,
  isAuthenticated: false,
  
  // Role & permissions
  role: null,
  clientId: null,
  hasLinkedClientRecord: false,
  
  // Status indicators
  hasError: false,
  errorMessage: null,
  
  // Additional states
  authLoadingTimeout: false,
  clientAuthLoadingTimeout: false,
  
  // Auth actions
  signIn: async () => ({ success: false, error: 'Auth provider not initialized' }),
  signOut: async () => ({ success: false, error: 'Auth provider not initialized' }),
  resetPassword: async () => ({ success: false, error: 'Auth provider not initialized' }),
  forgotPassword: async () => ({ success: false, error: 'Auth provider not initialized' }),
  
  // Client record actions
  createClientRecord: async () => ({ success: false, error: 'Auth provider not initialized' }),
});
