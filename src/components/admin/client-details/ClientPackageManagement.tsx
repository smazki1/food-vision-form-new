import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Package, Plus, RefreshCw, Edit, CheckCircle, Trash2, AlertCircle, Minus, FileImage, TrendingUp, Image } from 'lucide-react';
import { Client } from '@/types/client';
import { usePackages } from '@/hooks/usePackages';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { assignPackageToClient, updateClientServings, updateClientImages, assignPackageToClientWithImages } from '@/api/clientApi';
import { deletePackage } from '@/api/packageApi';
import ClientsPackageName from '../clients/ClientsPackageName';
import PackageFormDialog from '../packages/PackageFormDialog';
import { Package as PackageType } from '@/types/package';
import { useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface ClientPackageManagementProps {
  clientId: string;
  client: Client;
}

export const ClientPackageManagement: React.FC<ClientPackageManagementProps> = ({
  clientId,
  client
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    client.current_package_id
  );
  const [assigningPackageId, setAssigningPackageId] = useState<string | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [deleteDialogPackage, setDeleteDialogPackage] = useState<PackageType | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  
  const { packages, isLoading, invalidateCache } = usePackages();
  const queryClient = useQueryClient();
  
  // Get fresh client data to ensure immediate updates
  const { data: freshClientData } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId)
        .single();
      
      if (error) {
        console.error('Error fetching fresh client data:', error);
        throw error;
      }
      
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    enabled: !!clientId
  });
  
  // Use fresh data if available, fallback to prop
  const currentClient = freshClientData || client;
  
  // Update selected package when current client data changes
  useEffect(() => {
    if (currentClient?.current_package_id !== selectedPackageId) {
      setSelectedPackageId(currentClient?.current_package_id || null);
    }
  }, [currentClient?.current_package_id, selectedPackageId]);
  
  // Get submission stats for the client
  const { data: submissionStats, refetch: refetchSubmissionStats } = useClientSubmissionStats(clientId);
  
  // Optimistic package assignment mutation
  const packageAssignmentMutation = useMutation({
    mutationFn: async ({ packageId, selectedPkg }: { packageId: string; selectedPkg: PackageType }) => {
      // Calculate assignment values - handle null values properly
      const servingsToAssign = selectedPkg.total_servings || 0;
      const imagesToAssign = selectedPkg.total_images ?? 0;
      
      // Ensure at least one value is non-zero
      const finalServings = (servingsToAssign === 0 && imagesToAssign === 0) ? 1 : servingsToAssign;
      const finalImages = imagesToAssign;

      console.log('Optimistic package assignment:', {
        packageId,
        packageName: selectedPkg.package_name,
        servingsToAssign: finalServings,
        imagesToAssign: finalImages
      });

      // Perform the assignment using existing function
      return await assignPackageToClientWithImages(
        clientId,
        packageId,
        finalServings,
        finalImages,
        `הוקצתה חבילה: ${selectedPkg.package_name} (${finalServings} מנות, ${finalImages} תמונות)`,
        undefined
      );
    },
    onMutate: async ({ packageId, selectedPkg }) => {
      setAssigningPackageId(packageId);
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['client-detail', clientId] });
      
      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(['client-detail', clientId]);
      
      // Calculate optimistic values
      const servingsToAssign = selectedPkg.total_servings || 0;
      const imagesToAssign = selectedPkg.total_images ?? 0;
      const finalServings = (servingsToAssign === 0 && imagesToAssign === 0) ? 1 : servingsToAssign;
      const finalImages = imagesToAssign;
      
      // Optimistically update client data
      const optimisticClient = {
        ...currentClient,
        current_package_id: packageId,
        remaining_servings: (currentClient.remaining_servings || 0) + finalServings,
        remaining_images: (currentClient.remaining_images || 0) + finalImages,
        notes: `הוקצתה חבילה: ${selectedPkg.package_name} (${finalServings} מנות, ${finalImages} תמונות)`
      };
      
      // Update the cache optimistically
      queryClient.setQueryData(['client-detail', clientId], optimisticClient);
      
      // Update all related client caches
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: any) => 
          client.client_id === clientId ? optimisticClient : client
        );
      });
      
      // Update simplified caches
      const currentUserRole = queryClient.getQueryData(['currentUserRole']);
      if (currentUserRole) {
        const userId = (currentUserRole as any)?.userId;
        const status = (currentUserRole as any)?.status;
        if (userId && status) {
          queryClient.setQueryData(['clients_simplified', userId, status], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? optimisticClient : client
            );
          });
          
          queryClient.setQueryData(['clients_list_for_admin', userId], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? optimisticClient : client
            );
          });
        }
      }
      
      // Show immediate success feedback
      toast.success(`✅ החבילה "${selectedPkg.package_name}" הוקצתה ללקוח ${currentClient.restaurant_name}!`);
      
      return { previousClient, optimisticClient };
    },
    onError: (err, { selectedPkg }, context) => {
      // Rollback optimistic updates
      if (context?.previousClient) {
        queryClient.setQueryData(['client-detail', clientId], context.previousClient);
        
        // Rollback all related caches
        queryClient.setQueryData(['clients'], (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.map((client: any) => 
            client.client_id === clientId ? context.previousClient : client
          );
        });
        
        const currentUserRole = queryClient.getQueryData(['currentUserRole']);
        if (currentUserRole) {
          const userId = (currentUserRole as any)?.userId;
          const status = (currentUserRole as any)?.status;
          if (userId && status) {
            queryClient.setQueryData(['clients_simplified', userId, status], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((client: any) => 
                client.client_id === clientId ? context.previousClient : client
              );
            });
            
            queryClient.setQueryData(['clients_list_for_admin', userId], (oldData: any) => {
              if (!oldData) return oldData;
              return oldData.map((client: any) => 
                client.client_id === clientId ? context.previousClient : client
              );
            });
          }
        }
      }
      
      console.error('Package assignment error:', err);
      toast.error(`שגיאה בהקצאת החבילה "${selectedPkg.package_name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    },
    onSuccess: (updatedClient, { selectedPkg }) => {
      // Update with actual server response
      queryClient.setQueryData(['client-detail', clientId], updatedClient);
      
      // Update all related caches with real data
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: any) => 
          client.client_id === clientId ? updatedClient : client
        );
      });
      
      const currentUserRole = queryClient.getQueryData(['currentUserRole']);
      if (currentUserRole) {
        const userId = (currentUserRole as any)?.userId;
        const status = (currentUserRole as any)?.status;
        if (userId && status) {
          queryClient.setQueryData(['clients_simplified', userId, status], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
          
          queryClient.setQueryData(['clients_list_for_admin', userId], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
        }
      }
    },
    onSettled: () => {
      setAssigningPackageId(null);
    }
  });

  // Refresh all data mutation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Use Promise.all for parallel execution
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
        queryClient.invalidateQueries({ queryKey: ['packages'] }),
        refetchSubmissionStats()
      ]);
      
      toast.success('הנתונים רוענו בהצלחה');
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('שגיאה ברענון הנתונים');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Optimistic package assignment handler
  const handleDirectPackageAssignment = (packageId: string) => {
    const selectedPkg = packages?.find(pkg => pkg.package_id === packageId);
    if (!selectedPkg) {
      toast.error('לא נמצאה החבילה שנבחרה');
      return;
    }

    packageAssignmentMutation.mutate({ packageId, selectedPkg });
  };

  // Mutation for updating servings
  const updateServingsMutation = useMutation({
    mutationFn: ({ servings, notes }: { servings: number; notes: string }) => 
      updateClientServings(clientId, servings, notes),
    onMutate: async ({ servings }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['client-detail', clientId] });

      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(['client-detail', clientId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['client-detail', clientId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          remaining_servings: servings
        };
      });

      // Return a context object with the snapshotted value
      return { previousClient };
    },
    onSuccess: (updatedClient, variables) => {
      console.log('[ClientPackageManagement] Servings updated successfully, syncing cache...');
      
      // Update the fresh client data query immediately
      queryClient.setQueryData(['client-detail', clientId], updatedClient);
      
      // Update cache immediately for all relevant query variations
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: any) => 
          client.client_id === clientId ? updatedClient : client
        );
      });
      
      // Update specific client query variations without causing modal closure
      const currentUserRole = queryClient.getQueryData(['currentUserRole']);
      if (currentUserRole) {
        const userId = (currentUserRole as any)?.userId;
        const status = (currentUserRole as any)?.status;
        if (userId && status) {
          queryClient.setQueryData(['clients_simplified', userId, status], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
          
          queryClient.setQueryData(['clients_list_for_admin', userId], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
        }
      }
      
      console.log('[ClientPackageManagement] Cache updated with new servings:', updatedClient.remaining_servings);
      toast.success(`מנות עודכנו ל-${variables.servings}`);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['client-detail', clientId], context?.previousClient);
      console.error('Error updating servings:', error);
      toast.error('שגיאה בעדכון המנות');
    },
  });

  // Mutation for updating images
  const updateImagesMutation = useMutation({
    mutationFn: ({ images, notes }: { images: number; notes: string }) => 
      updateClientImages(clientId, images, notes),
    onMutate: async ({ images }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['client-detail', clientId] });

      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(['client-detail', clientId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['client-detail', clientId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          remaining_images: images
        };
      });

      // Return a context object with the snapshotted value
      return { previousClient };
    },
    onSuccess: (updatedClient, variables) => {
      console.log('[ClientPackageManagement] Images updated successfully, syncing cache...');
      
      // Update the fresh client data query immediately
      queryClient.setQueryData(['client-detail', clientId], updatedClient);
      
      // Update cache immediately for all relevant query variations
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: any) => 
          client.client_id === clientId ? updatedClient : client
        );
      });
      
      // Update specific client query variations without causing modal closure
      const currentUserRole = queryClient.getQueryData(['currentUserRole']);
      if (currentUserRole) {
        const userId = (currentUserRole as any)?.userId;
        const status = (currentUserRole as any)?.status;
        if (userId && status) {
          queryClient.setQueryData(['clients_simplified', userId, status], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
          
          queryClient.setQueryData(['clients_list_for_admin', userId], (oldData: any) => {
            if (!oldData) return oldData;
            return oldData.map((client: any) => 
              client.client_id === clientId ? updatedClient : client
            );
          });
        }
      }
      
      console.log('[ClientPackageManagement] Cache updated with new images:', updatedClient.remaining_images);
      toast.success(`תמונות עודכנו ל-${variables.images}`);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['client-detail', clientId], context?.previousClient);
      console.error('Error updating images:', error);
      toast.error('שגיאה בעדכון התמונות');
    },
  });

  // Helper functions for servings adjustment
  const adjustServings = (increment: number) => {
    const currentServings = currentClient.remaining_servings;
    const newServings = Math.max(0, currentServings + increment);
    const action = increment > 0 ? 'הוספת' : 'הפחתת';
    const amount = Math.abs(increment);
    
    updateServingsMutation.mutate({
      servings: newServings,
      notes: `${action} ${amount} מנות ידנית (${currentServings} → ${newServings})`
    });
  };

  const increaseServings = () => adjustServings(1);
  const decreaseServings = () => adjustServings(-1);
  const increaseFiveServings = () => adjustServings(5);
  const decreaseFiveServings = () => adjustServings(-5);

  // Helper functions for images adjustment
  const adjustImages = (increment: number) => {
    const currentImages = currentClient.remaining_images || 0;
    const newImages = Math.max(0, currentImages + increment);
    const action = increment > 0 ? 'הוספת' : 'הפחתת';
    const amount = Math.abs(increment);
    
    updateImagesMutation.mutate({
      images: newImages,
      notes: `${action} ${amount} תמונות ידנית (${currentImages} → ${newImages})`
    });
  };

  const increaseImages = () => adjustImages(1);
  const decreaseImages = () => adjustImages(-1);
  const increaseFiveImages = () => adjustImages(5);
  const decreaseFiveImages = () => adjustImages(-5);

  // Delete package mutation
  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      // Invalidate all package-related queries
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === 'packages' || query.queryKey[0] === 'packages_simplified'
      });
      // Force immediate refetch
      queryClient.refetchQueries({ predicate: (query) => 
        query.queryKey[0] === 'packages_simplified'
      });
      if (invalidateCache) {
        invalidateCache();
      }
      toast.success('החבילה נמחקה בהצלחה');
      setDeleteDialogPackage(null);
      // If the deleted package was selected, clear selection
      if (deleteDialogPackage && selectedPackageId === deleteDialogPackage.package_id) {
        setSelectedPackageId(currentClient.current_package_id);
      }
    },
    onError: (error) => {
      console.error('Error deleting package:', error);
      toast.error('שגיאה במחיקת החבילה');
    },
  });

  const handleDeletePackage = (pkg: PackageType) => {
    setDeleteDialogPackage(pkg);
  };

  const confirmDeletePackage = () => {
    if (deleteDialogPackage) {
      deleteMutation.mutate(deleteDialogPackage.package_id);
    }
  };

  // Handle package creation/edit success
  const handlePackageCreated = () => {
    console.log('[ClientPackageManagement] Package created/edited, refreshing packages list');
    
    // Force comprehensive refresh of packages using all available methods
    queryClient.invalidateQueries({ queryKey: ['packages'] });
    queryClient.invalidateQueries({ queryKey: ['packages_simplified'] });
    
    // Also invalidate the cached query specifically (most important for useCachedQuery)
    if (invalidateCache) {
      invalidateCache();
    }
    
    // Force immediate refetch to ensure UI updates
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['packages'] });
      queryClient.refetchQueries({ queryKey: ['packages_simplified'] });
    }, 100);
    
    // Close dialogs
    setIsCreatingPackage(false);
    setEditingPackage(null);
    
    // The success toast is already shown by the package form hook
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            ניהול חבילות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">טוען חבילות...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Current Package Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                חבילה נוכחית
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
                title="רענן נתונים"
              >
                {isRefreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">חבילה מוקצית</h3>
                <div className="flex items-center gap-2">
                  {currentClient.current_package_id ? (
                    <>
                      <ClientsPackageName packageId={currentClient.current_package_id} />
                      <Badge variant="secondary" className="text-xs">פעיל</Badge>
                    </>
                  ) : (
                    <span className="text-gray-500">לא הוקצתה חבילה</span>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-2">מנות שנותרו</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={currentClient.remaining_servings > 0 ? "default" : "destructive"} className="text-lg">
                    {currentClient.remaining_servings}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseServings}
                      disabled={updateServingsMutation.isPending || currentClient.remaining_servings <= 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseServings}
                      disabled={updateServingsMutation.isPending}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseFiveServings}
                    disabled={updateServingsMutation.isPending || currentClient.remaining_servings < 5}
                    className="h-6 text-xs px-2"
                  >
                    -5
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseFiveServings}
                    disabled={updateServingsMutation.isPending}
                    className="h-6 text-xs px-2"
                  >
                    +5
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">תמונות שנותרו</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={(currentClient.remaining_images || 0) > 0 ? "default" : "destructive"} className="text-lg">
                    {currentClient.remaining_images || 0}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={decreaseImages}
                      disabled={updateImagesMutation.isPending || (currentClient.remaining_images || 0) <= 0}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={increaseImages}
                      disabled={updateImagesMutation.isPending}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={decreaseFiveImages}
                    disabled={updateImagesMutation.isPending || (currentClient.remaining_images || 0) < 5}
                    className="h-6 text-xs px-2"
                  >
                    -5
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={increaseFiveImages}
                    disabled={updateImagesMutation.isPending}
                    className="h-6 text-xs px-2"
                  >
                    +5
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-2">סטטיסטיקות</h3>
                <div className="space-y-2">
                  {submissionStats && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <FileImage className="h-4 w-4 text-blue-500" />
                        <span>הגשות: {submissionStats.total}</span>
                      </div>
                      {submissionStats.processed > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span>מעובדות: {submissionStats.processed}</span>
                        </div>
                      )}
                      {submissionStats.pending > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          <span>בהמתנה: {submissionStats.pending}</span>
                        </div>
                      )}
                    </>
                  )}
                  {(!submissionStats || submissionStats.total === 0) && (
                    <span className="text-sm text-gray-500">אין הגשות עדיין</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                בחירת חבילה
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingPackage(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                צור חבילה חדשה
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {packages && packages.length > 0 ? (
              <div className="grid gap-3">
                {packages
                  .filter(pkg => pkg.is_active)
                  .map((pkg) => (
                    <div
                      key={pkg.package_id}
                      className={`relative p-4 border rounded-lg transition-all cursor-pointer group ${
                        currentClient.current_package_id === pkg.package_id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                      onClick={() => !assigningPackageId && handleDirectPackageAssignment(pkg.package_id)}
                    >
                      {/* Loading Overlay */}
                      {assigningPackageId === pkg.package_id && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                            <span className="font-medium">מקצה חבילה...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Package Content */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{pkg.package_name}</h4>
                            {currentClient.current_package_id === pkg.package_id && (
                              <Badge className="bg-green-100 text-green-800 text-xs">חבילה נוכחית</Badge>
                            )}
                          </div>
                          
                          {pkg.description && (
                            <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                          )}
                          
                          {/* Package Stats */}
                          <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="font-medium">{pkg.total_servings || 0} מנות</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="font-medium">{pkg.total_images || 0} תמונות</span>
                            </div>
                            {pkg.price && (
                              <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="font-medium">₪{pkg.price}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delete Button (Admin only) */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePackage(pkg);
                          }}
                          disabled={deleteMutation.isPending && deleteDialogPackage?.package_id === pkg.package_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {deleteMutation.isPending && deleteDialogPackage?.package_id === pkg.package_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Click to Assign Hint */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">לחץ להקצאת חבילה</span>
                          <div className="flex items-center gap-1 text-blue-600 group-hover:text-blue-700">
                            <span className="font-medium">הקצה</span>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>לא נמצאו חבילות פעילות במערכת</p>
                <p className="text-sm mt-2">צור חבילה חדשה להתחיל</p>
              </div>
            )}
          </CardContent>
        </Card>


      </div>

      {/* Package Creation/Edit Dialog */}
      <PackageFormDialog
        open={isCreatingPackage || !!editingPackage}
        onClose={handlePackageCreated}
        packageToEdit={editingPackage}
      />





      {/* Package Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!deleteDialogPackage} 
        onOpenChange={(open) => !open && setDeleteDialogPackage(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת חבילה</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את החבילה "{deleteDialogPackage?.package_name}"? 
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePackage}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'מוחק...' : 'מחק חבילה'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}; 