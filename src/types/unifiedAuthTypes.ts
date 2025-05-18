
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'customer' | 'admin' | 'editor' | null;

export interface UnifiedAuthState {
  // Basic auth
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  isAuthenticated: boolean;
  
  // Role & permissions
  role: UserRole;
  clientId: string | null;
  hasLinkedClientRecord: boolean;
  
  // Status indicators
  hasError: boolean;
  errorMessage: string | null;
  
  // Additional states
  authLoadingTimeout: boolean;
  clientAuthLoadingTimeout: boolean;
}

export interface UnifiedAuthContextType extends UnifiedAuthState {
  // Auth actions
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  
  // Client record actions
  createClientRecord: (clientData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
  }) => Promise<{ success: boolean; clientId?: string; error?: string }>;
}
