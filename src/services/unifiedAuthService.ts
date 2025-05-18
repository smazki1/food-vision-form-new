
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Service for handling unified authentication operations
 */
export const unifiedAuthService = {
  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('[UNIFIED_AUTH_SERVICE] Sign in error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[UNIFIED_AUTH_SERVICE] Sign out error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sign out failed'
      };
    }
  },

  /**
   * Reset user password using email
   */
  resetPasswordForEmail: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('[UNIFIED_AUTH_SERVICE] Reset password error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  },

  /**
   * Create a client record for the user
   */
  createClientRecord: async (
    userId: string,
    clientData: {
      restaurant_name: string;
      contact_name: string;
      phone: string;
      email: string;
    }
  ) => {
    try {
      // First check if client record already exists for this user
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('client_id')
        .eq('user_auth_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('[UNIFIED_AUTH_SERVICE] Check client existence error:', checkError);
        return { error: { message: 'Error checking for existing client record' } };
      }
      
      if (existingClient) {
        console.log('[UNIFIED_AUTH_SERVICE] Client record already exists:', existingClient);
        return { clientId: existingClient.client_id };
      }
      
      // Create new client record
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_auth_id: userId,
          restaurant_name: clientData.restaurant_name,
          contact_name: clientData.contact_name,
          phone: clientData.phone,
          email: clientData.email,
        })
        .select('client_id')
        .single();
      
      if (insertError) {
        console.error('[UNIFIED_AUTH_SERVICE] Create client record error:', insertError);
        return { error: { 
          message: insertError.message, 
          details: insertError.details,
          code: insertError.code 
        }};
      }
      
      return { clientId: newClient.client_id };
    } catch (error) {
      console.error('[UNIFIED_AUTH_SERVICE] Create client record exception:', error);
      return { error: { 
        message: error instanceof Error ? error.message : 'Error creating client record'
      }};
    }
  },
};
