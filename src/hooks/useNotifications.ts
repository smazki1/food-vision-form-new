import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  link?: string;
  related_entity_id?: string;
  related_entity_type?: string;
  created_at: string;
  read_status: boolean;
}

export function useNotifications() {
  const { role } = useCurrentUserRole();
  const queryClient = useQueryClient();
  // Increased polling interval from 30 seconds to 5 minutes to reduce system load
  const [notificationsPollingInterval, setNotificationsPollingInterval] = useState(300000);
  
  // Fetch user ID from auth session
  const { data: userId } = useQuery({
    queryKey: ['user-id'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Return null instead of undefined to avoid React Query warnings
      return session?.user?.id || null;
    },
    staleTime: 1000 * 60 * 10, // Cache user ID for 10 minutes
  });

  // Fetch notifications for the current user
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Temporarily cast to any to avoid TypeScript errors until Supabase types are updated
      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }
      
      return data as Notification[];
    },
    enabled: !!userId,
    refetchInterval: false, // Disabled automatic polling to reduce system load
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Listen for real-time updates to notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  // Mark a notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      // Temporarily cast to any to avoid TypeScript errors until Supabase types are updated
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_status: true })
        .eq('notification_id', notificationId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      
      // Temporarily cast to any to avoid TypeScript errors until Supabase types are updated
      const { error } = await (supabase
        .from('notifications') as any)
        .update({ read_status: true })
        .eq('user_id', userId)
        .eq('read_status', false);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  return {
    notifications,
    loading: isLoading,
    markAsRead: (notificationId: string) => markAsReadMutation.mutate(notificationId),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isAdmin: role === 'admin',
    isEditor: role === 'editor',
  };
}
