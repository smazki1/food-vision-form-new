
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface OptimisticUpdate<T> {
  id: string;
  data: T;
  operation: 'create' | 'update' | 'delete';
  queryKey: string[];
  originalData?: T;
}

export function useOptimisticUpdates<T>() {
  const queryClient = useQueryClient();
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, OptimisticUpdate<T>>>(new Map());

  const applyOptimisticUpdate = useCallback((update: OptimisticUpdate<T>) => {
    const { id, data, operation, queryKey } = update;
    
    // Store the update
    setPendingUpdates(prev => new Map(prev.set(id, update)));

    // Apply optimistic update to React Query cache
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return oldData;

      switch (operation) {
        case 'create':
          return [...oldData, data];
        case 'update':
          return oldData.map((item: any) => 
            item.id === (data as any).id ? { ...item, ...data } : item
          );
        case 'delete':
          return oldData.filter((item: any) => item.id !== (data as any).id);
        default:
          return oldData;
      }
    });

    console.log(`[OPTIMISTIC] Applied ${operation} for ${id}`);
  }, [queryClient]);

  const confirmUpdate = useCallback((id: string, serverData?: T) => {
    const update = pendingUpdates.get(id);
    if (!update) return;

    // If server data is provided, update cache with server response
    if (serverData) {
      queryClient.setQueryData(update.queryKey, (oldData: T[] | undefined) => {
        if (!oldData) return oldData;
        
        return oldData.map((item: any) => 
          item.id === (serverData as any).id ? serverData : item
        );
      });
    }

    // Remove from pending updates
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    console.log(`[OPTIMISTIC] Confirmed update for ${id}`);
  }, [pendingUpdates, queryClient]);

  const revertUpdate = useCallback((id: string, error?: Error) => {
    const update = pendingUpdates.get(id);
    if (!update) return;

    const { operation, queryKey, originalData } = update;

    // Revert the optimistic update
    queryClient.setQueryData(queryKey, (oldData: T[] | undefined) => {
      if (!oldData) return oldData;

      switch (operation) {
        case 'create':
          return oldData.filter((item: any) => item.id !== (update.data as any).id);
        case 'update':
          if (originalData) {
            return oldData.map((item: any) => 
              item.id === (originalData as any).id ? originalData : item
            );
          }
          break;
        case 'delete':
          if (originalData) {
            return [...oldData, originalData];
          }
          break;
      }
      return oldData;
    });

    // Remove from pending updates
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });

    // Show error toast
    if (error) {
      toast.error(`פעולה נכשלה: ${error.message}`);
    }

    console.log(`[OPTIMISTIC] Reverted update for ${id}`, error);
  }, [pendingUpdates, queryClient]);

  const hasPendingUpdate = useCallback((id: string) => {
    return pendingUpdates.has(id);
  }, [pendingUpdates]);

  return {
    applyOptimisticUpdate,
    confirmUpdate,
    revertUpdate,
    hasPendingUpdate,
    pendingUpdatesCount: pendingUpdates.size
  };
}
