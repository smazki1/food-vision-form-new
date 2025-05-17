
import { User, Session } from '@supabase/supabase-js';

// Define a more robust authentication state interface
export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean; 
  isAuthenticated: boolean;
};

export type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  customerLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
};
