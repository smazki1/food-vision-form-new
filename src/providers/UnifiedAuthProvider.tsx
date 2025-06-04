import React, { useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { UnifiedAuthContext } from '@/contexts/UnifiedAuthContext';
import { useUnifiedAuthState } from '@/hooks/useUnifiedAuthState';
import { useAuthInitialization } from '@/hooks/useAuthInitialization';
import { unifiedAuthService } from '@/services/unifiedAuthService';

interface UnifiedAuthProviderProps {
  children: ReactNode;
}

export const UnifiedAuthProvider: React.FC<UnifiedAuthProviderProps> = ({ children }) => {
  const { updateAuthState, ...authState } = useUnifiedAuthState();

  // Initialize authentication and role logic
  useAuthInitialization(updateAuthState);

  // Auth actions
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      updateAuthState({ loading: true });
      const { success, error, data } = await unifiedAuthService.signInWithPassword(email, password);

      if (!success) {
        updateAuthState({ 
          loading: false,
          hasError: true,
          errorMessage: error || 'Login failed'
        });
        return { success: false, error };
      }

      // For temporary bypass, manually update auth state since Supabase listener won't fire
      if (data?.user && data?.session) {
        console.log('[UNIFIED_AUTH] Login successful, updating auth state:', {
          userId: data.user.id,
          email: data.user.email
        });
        
        // Determine role based on email for test users
        const isAdminUser = data.user.email === 'admin@test.local';
        
        updateAuthState({
          user: data.user,
          session: data.session,
          isAuthenticated: true,
          loading: false,
          initialized: true,
          hasError: false,
          errorMessage: null,
          // Set role based on user type
          role: isAdminUser ? 'admin' : 'customer',
          // Admin users don't need a clientId
          clientId: isAdminUser ? null : 'c7b3d8e2-4f5a-4b9c-8d7e-1a2b3c4d5e6f'
        });
        
        // TEMPORARY: Store user info in localStorage for test bypass
        localStorage.setItem('unifiedAuthUser', JSON.stringify(data.user));
        if (isAdminUser) {
          localStorage.setItem('adminAuthenticated', 'true');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Login exception:', error);
      updateAuthState({ 
        loading: false,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'התרחשה שגיאה בתהליך ההתחברות. אנא נסה שוב מאוחר יותר.'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'התרחשה שגיאה בתהליך ההתחברות. אנא נסה שוב מאוחר יותר.'
      };
    }
  }, [updateAuthState]);

  const signOut = useCallback(async () => {
    updateAuthState({ loading: true });
    try {
      const { success, error } = await unifiedAuthService.signOut();

      updateAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        role: null,
        clientId: null,
        hasLinkedClientRecord: false,
        loading: false,
        initialized: true,
        hasError: false,
        errorMessage: null
      });
      
      // TEMPORARY: Clear test user data from localStorage
      localStorage.removeItem('unifiedAuthUser');
      localStorage.removeItem('adminAuthenticated');

      if (!success) {
        console.warn('[UNIFIED_AUTH] unifiedAuthService.signOut error:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Sign out exception:', error);
      updateAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        role: null,
        clientId: null,
        hasLinkedClientRecord: false,
        loading: false,
        initialized: true,
        hasError: true,
        errorMessage: error instanceof Error ? error.message : 'התרחשה שגיאה חריגה בתהליך היציאה.'
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'התרחשה שגיאה חריגה בתהליך היציאה.'
      };
    }
  }, [updateAuthState]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      return await unifiedAuthService.resetPasswordForEmail(email);
    } catch (error) {
      console.error('[UNIFIED_AUTH] Reset password error:', error);
      return {
        success: false,
        error: 'התרחשה שגיאה בתהליך איפוס הסיסמה. אנא נסה שוב מאוחר יותר.'
      };
    }
  }, []);

  const forgotPassword = useCallback((email: string) => resetPassword(email), [resetPassword]);

  const createClientRecord = useCallback(async (clientData: {
    restaurant_name: string;
    contact_name: string;
    phone: string;
    email: string;
  }) => {
    if (!authState.user?.id) {
      return {
        success: false,
        error: 'You must be logged in to create a client record.'
      };
    }

    try {
      updateAuthState({ loading: true });

      const { clientId, error } = await unifiedAuthService.createClientRecord(
        authState.user.id,
        clientData
      );

      if (error) {
        updateAuthState({
          loading: false,
          hasError: true,
          errorMessage: error.message
        });
        return { success: false, error: error.message };
      }

      updateAuthState({
        clientId,
        hasLinkedClientRecord: !!clientId,
        role: 'customer',
        loading: false
      });

      toast.success('Client record created successfully!');
      return { success: true, clientId };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Create client record error:', error);
      updateAuthState({ loading: false });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creating client record.'
      };
    }
  }, [authState.user, updateAuthState]);

  const contextValue = {
    ...authState,
    signIn,
    signOut,
    resetPassword,
    forgotPassword,
    createClientRecord
  };

  console.log("[UNIFIED_AUTH] Provider render state:", {
    userId: authState.user?.id,
    role: authState.role,
    clientId: authState.clientId,
    loading: authState.loading,
    initialized: authState.initialized,
    hasError: authState.hasError
  });

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};
