
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get the current Supabase user ID
 */
export function useSupabaseUserId() {
  const { data: userId, isLoading } = useQuery({
    queryKey: ['supabase-user-id'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user?.id || null;
    }
  });

  return {
    userId,
    isLoading
  };
}
