import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [newServingsCount, setNewServingsCount] = useState<number>(0);
  const [newImagesCount, setNewImagesCount] = useState<number>(0);
  const [deleteDialogPackage, setDeleteDialogPackage] = useState<PackageType | null>(null);
  const [isPackageDialogOpen, setIsPackageDialogOpen] = useState(false);
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
  
  // Refresh all data mutation
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      console.log('[ClientPackageManagement] Starting data refresh for client:', clientId);
      
      // Refresh packages data
      if (invalidateCache) {
        await invalidateCache();
      }
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['packages_simplified'] });
      
      // Refresh all client data - comprehensive invalidation
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      await queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return key.includes('clients_simplified') || 
                 key.includes('clients_list_for_admin') ||
                 key.includes('client-submission-stats') ||
                 key.includes('client-submissions');
        }
      });
      
      // Force refetch of submission stats
      if (refetchSubmissionStats) {
        await refetchSubmissionStats();
      }
      
      // Also invalidate the specific client submission stats
      await queryClient.invalidateQueries({ queryKey: ['client-submission-stats', clientId] });
      await queryClient.invalidateQueries({ queryKey: ['client-submissions', clientId] });
      
      // Force fresh data by removing cache and refetching
      queryClient.removeQueries({ queryKey: ['client-submission-stats', clientId] });
      
      // Wait a bit for cache clearing then force refetch
      setTimeout(async () => {
        if (refetchSubmissionStats) {
          await refetchSubmissionStats();
        }
      }, 100);
      
      console.log('[ClientPackageManagement] Data refresh completed successfully');
      toast.success('הנתונים רועננו בהצלחה');
    } catch (error) {
      console.error('[ClientPackageManagement] Error refreshing data:', error);
      toast.error('שגיאה ברענון הנתונים');
    } finally {
      setIsRefreshing(false);
    }
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

  // Find the currently selected package
  const selectedPackage = packages?.find(pkg => pkg.package_id === selectedPackageId);

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
        setNewServingsCount(0);
        setNewImagesCount(0);
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

  // Handle package selection - directly open popup
  const handlePackageSelection = (packageId: string, defaultServings: number) => {
    const selectedPkg = packages?.find(pkg => pkg.package_id === packageId);
    setSelectedPackageId(packageId);
    setNewServingsCount(defaultServings);
    setNewImagesCount(selectedPkg?.total_images || 0);
    setIsPackageDialogOpen(true); // Open popup immediately
  };
  
  // Handle package assignment (after confirmation)
  const handleConfirmPackageAssignment = async () => {
    if (!selectedPackageId || !selectedPackage) {
      toast.error('אנא בחר חבילה לפני ההקצאה');
      return;
    }

    try {
      setIsAssigning(true);
      
      const servingsToAssign = newServingsCount || selectedPackage.total_servings || 0;
      const imagesToAssign = newImagesCount || selectedPackage.total_images || 0;
      
      // Perform the assignment with both servings and images
      const updatedClient = await assignPackageToClientWithImages(
        clientId,
        selectedPackageId,
        servingsToAssign,
        imagesToAssign,
        `הוקצתה חבילה: ${selectedPackage.package_name} (${servingsToAssign} מנות, ${imagesToAssign} תמונות)`,
        undefined
      );

      // Force immediate cache update with the new client data for all client-related queries
      queryClient.setQueryData(['clients'], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.map((client: any) => 
          client.client_id === clientId ? updatedClient : client
        );
      });

      // Update all variations of client queries with specific query keys to avoid modal closure
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

      // Gentle invalidation - mark as stale but don't force immediate refetch
      setTimeout(() => {
        queryClient.invalidateQueries({ 
          queryKey: ['clients'],
          refetchType: 'none' // Don't refetch immediately, just mark as stale
        });
        queryClient.invalidateQueries({ 
          queryKey: ['clients_simplified'],
          refetchType: 'none'
        });
      }, 1000); // Delay to prevent modal closure
      
      // Also refresh packages to ensure UI is in sync
      if (invalidateCache) {
        invalidateCache();
      }
      
      toast.success(`החבילה "${selectedPackage.package_name}" הוקצתה בהצלחה ללקוח!`);
      
      // Reset the selection state to the newly assigned package
      setSelectedPackageId(selectedPackageId);
      setNewServingsCount(0);
      setNewImagesCount(0);
      setIsPackageDialogOpen(false); // Close the assignment dialog
      
    } catch (error) {
      console.error('Error assigning package:', error);
      toast.error('שגיאה בהקצאת החבילה');
    } finally {
      setIsAssigning(false);
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
                      className={`p-4 border rounded-lg transition-all ${
                        selectedPackageId === pkg.package_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handlePackageSelection(pkg.package_id, pkg.total_servings || 0)}
                        >
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{pkg.package_name}</h4>
                            {selectedPackageId === pkg.package_id && (
                              <CheckCircle className="h-5 w-5 text-blue-500" />
                            )}
                            {currentClient.current_package_id === pkg.package_id && (
                              <Badge variant="outline" className="text-xs">נוכחי</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            {pkg.total_servings && (
                              <span className="text-blue-600">
                                {pkg.total_servings} מנות
                              </span>
                            )}
                            {pkg.total_images && (
                              <span className="text-purple-600">
                                {pkg.total_images} תמונות
                              </span>
                            )}
                            {pkg.price && (
                              <span className="text-green-600">
                                ₪{pkg.price}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePackage(pkg);
                          }}
                          disabled={deleteMutation.isPending && deleteDialogPackage?.package_id === pkg.package_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-2"
                        >
                          {deleteMutation.isPending && deleteDialogPackage?.package_id === pkg.package_id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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

      {/* Package Assignment Dialog - Opens directly when clicking a package */}
      <Dialog open={isPackageDialogOpen} onOpenChange={setIsPackageDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              הקצאת חבילה ללקוח - {currentClient.restaurant_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="space-y-6">
              {/* Current Client Status */}
              <div className="p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-2">מצב נוכחי:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium">חבילה נוכחית: </span>
                    {currentClient.current_package_id ? (
                      <ClientsPackageName packageId={currentClient.current_package_id} />
                    ) : (
                      <span className="text-gray-500">אין חבילה</span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">מנות נותרו: </span>
                    <span className={currentClient.remaining_servings > 0 ? "text-green-600" : "text-red-600"}>
                      {currentClient.remaining_servings}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">תמונות נותרו: </span>
                    <span className={(currentClient.remaining_images || 0) > 0 ? "text-green-600" : "text-red-600"}>
                      {currentClient.remaining_images || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Package Details */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3">החבילה החדשה:</h4>
                <h3 className="text-lg font-bold text-blue-600 mb-2">{selectedPackage.package_name}</h3>
                {selectedPackage.description && (
                  <p className="text-sm text-gray-600 mb-3">{selectedPackage.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">מנות בחבילה: </span>
                    <span className="text-blue-600 font-semibold">{selectedPackage.total_servings || 'לא מוגדר'}</span>
                  </div>
                  <div>
                    <span className="font-medium">תמונות בחבילה: </span>
                    <span className="text-purple-600 font-semibold">{selectedPackage.total_images || 'לא מוגדר'}</span>
                  </div>
                  {selectedPackage.price && (
                    <div>
                      <span className="font-medium">מחיר: </span>
                      <span className="text-green-600 font-semibold">₪{selectedPackage.price}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Servings Assignment */}
              <div className="space-y-2">
                <Label htmlFor="servings-assignment" className="text-base font-semibold">
                  מנות להקצאה ללקוח:
                </Label>
                <Input
                  id="servings-assignment"
                  type="number"
                  value={newServingsCount}
                  onChange={(e) => setNewServingsCount(Number(e.target.value))}
                  className="text-lg text-center"
                  min="0"
                  max={selectedPackage.total_servings || undefined}
                />
                <p className="text-xs text-gray-500">
                  הזן את מספר המנות שברצונך להקצות ללקוח זה
                </p>
              </div>

              {/* Images Assignment */}
              <div className="space-y-2">
                <Label htmlFor="images-assignment" className="text-base font-semibold">
                  תמונות להקצאה ללקוח:
                </Label>
                <Input
                  id="images-assignment"
                  type="number"
                  value={newImagesCount}
                  onChange={(e) => setNewImagesCount(Number(e.target.value))}
                  className="text-lg text-center"
                  min="0"
                  max={selectedPackage.total_images || undefined}
                />
                <p className="text-xs text-gray-500">
                  הזן את מספר התמונות שברצונך להקצות ללקוח זה
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleConfirmPackageAssignment}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isAssigning || (newServingsCount <= 0 && newImagesCount <= 0)}
                >
                  {isAssigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      מקצה חבילה...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      הקצה חבילה ({newServingsCount} מנות, {newImagesCount} תמונות)
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPackageDialogOpen(false)}
                  disabled={isAssigning}
                >
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>



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