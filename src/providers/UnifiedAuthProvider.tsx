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
        updateAuthState({ loading: false });
        return { success: false, error };
      }
      // Auth state will update from onAuthStateChange
      return { success: true };
    } catch (error) {
      console.error('[UNIFIED_AUTH] Login exception:', error);
      updateAuthState({ loading: false });
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

      // Clear state immediately
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

  // Alias
  const forgotPassword = useCallback((email: string) => resetPassword(email), [resetPassword]);

  // Client record management
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

  // Compose context value
  const contextValue = {
    ...authState,
    signIn,
    signOut,
    resetPassword,
    forgotPassword,
    createClientRecord
  };

  // For debugging
  console.log("[UNIFIED_AUTH] Provider render state:", {
    userId: authState.user?.id,
    role: authState.role,
    clientId: authState.clientId,
    loading: authState.loading,
    initialized: authState.initialized,
    hasError: authState.hasError
  });

  // Render error screen if there's a "no role" or major auth error
  if (authState.hasError &&
      (authState.errorMessage?.includes('Failed to determine user role') ||
       authState.errorMessage === 'User has no defined role or client record')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              שגיאה בטעינת פרטי המשתמש
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              לא הצלחנו לזהות את התפקיד שלך במערכת. ייתכן שיש בעיה בהרשאות או בחיבור למסד הנתונים.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
              >
                רענן את הדף
              </button>
              <button
                onClick={signOut}
                className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90"
              >
                התנתק וחזור לדף הבית
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedAuthContext.Provider value={contextValue}>
      {children}
    </UnifiedAuthContext.Provider>
  );
};