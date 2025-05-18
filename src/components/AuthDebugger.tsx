
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSupabaseUserId } from '@/hooks/useSupabaseUserId';
import { supabase } from '@/integrations/supabase/client';

/**
 * Component that renders nothing visually but logs authentication state for debugging
 */
export const AuthDebugger: React.FC = () => {
  const location = useLocation();
  const { userId, isLoading } = useSupabaseUserId();

  // Check direct session status on mount and periodically
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('[AUTH_DEBUGGER] Direct session check:', {
          hasSession: !!sessionData?.session,
          userId: sessionData?.session?.user?.id,
          error: sessionError?.message,
          currentPath: location.pathname
        });
      } catch (error) {
        console.error('[AUTH_DEBUGGER] Error checking session:', error);
      }
    };

    // Initial check
    checkSession();

    // Set up periodic checks
    const intervalId = setInterval(checkSession, 10000);

    return () => clearInterval(intervalId);
  }, [location]);

  // Log auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AUTH_DEBUGGER] Auth state changed:', {
          event,
          userId: session?.user?.id,
          currentPath: location.pathname
        });
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [location]);

  // Log userId from hook
  useEffect(() => {
    console.log('[AUTH_DEBUGGER] useSupabaseUserId hook:', {
      userId,
      isLoading,
      currentPath: location.pathname
    });
  }, [userId, isLoading, location]);

  // Log when component mounts/unmounts
  useEffect(() => {
    console.log('[AUTH_DEBUGGER] Component mounted on path:', location.pathname);
    return () => {
      console.log('[AUTH_DEBUGGER] Component unmounted from path:', location.pathname);
    };
  }, [location]);

  // This component doesn't render anything visible
  return null;
};
