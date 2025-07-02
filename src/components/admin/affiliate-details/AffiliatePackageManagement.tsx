import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, RefreshCw, Edit, CheckCircle, Trash2, AlertCircle, Minus, FileImage, TrendingUp, Image } from 'lucide-react';
import { Affiliate } from '@/types/affiliate';
import { usePackages } from '@/hooks/usePackages';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deletePackage } from '@/api/packageApi';
import PackageFormDialog from '../packages/PackageFormDialog';
import { Package as PackageType } from '@/types/package';
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
import { 
  useAssignPackageToAffiliateWithImages,
  useUpdateAffiliateServings,
  useUpdateAffiliateImages,
  useAffiliateAssignedPackages
} from '@/hooks/useAffiliatePackageManagement';

interface AffiliatePackageManagementProps {
  affiliateId: string;
  affiliate: Affiliate;
}

export const AffiliatePackageManagement: React.FC<AffiliatePackageManagementProps> = ({
  affiliateId,
  affiliate
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    affiliate.current_package_id
  );
  const [assigningPackageId, setAssigningPackageId] = useState<string | null>(null);
  const [isCreatingPackage, setIsCreatingPackage] = useState(false);
  const [deleteDialogPackage, setDeleteDialogPackage] = useState<PackageType | null>(null);
  const [editingPackage, setEditingPackage] = useState<PackageType | null>(null);
  
  const { packages, isLoading, invalidateCache } = usePackages();
  const queryClient = useQueryClient();
  
  // Affiliate package management hooks
  const assignPackageMutation = useAssignPackageToAffiliateWithImages();
  const updateServingsMutation = useUpdateAffiliateServings();
  const updateImagesMutation = useUpdateAffiliateImages();
  const { data: assignedPackages } = useAffiliateAssignedPackages(affiliateId);
  
  // Get fresh affiliate data to ensure immediate updates
  const { data: freshAffiliateData } = useQuery({
    queryKey: ['affiliate-detail', affiliateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .eq('affiliate_id', affiliateId)
        .single();
      
      if (error) {
        console.error('Error fetching fresh affiliate data:', error);
        throw error;
      }
      
      return data;
    },
    staleTime: 0, // Always fetch fresh data
    enabled: !!affiliateId
  });
  
  // Use fresh data if available, fallback to prop
  const currentAffiliate = freshAffiliateData || affiliate;
  
  // Update selected package when current affiliate data changes
  useEffect(() => {
    if (currentAffiliate?.current_package_id !== selectedPackageId) {
      setSelectedPackageId(currentAffiliate?.current_package_id || null);
    }
  }, [currentAffiliate?.current_package_id, selectedPackageId]);
  
  // Direct package assignment handler
  const handleDirectPackageAssignment = async (packageId: string) => {
    const selectedPkg = packages.find(pkg => pkg.package_id === packageId);
    if (!selectedPkg || assigningPackageId) return;

    setAssigningPackageId(packageId);
    
    try {
      // Calculate assignment values - handle null values properly
      const servingsToAssign = selectedPkg.total_servings || 0;
      const imagesToAssign = selectedPkg.total_images ?? 0;
      
      // Ensure at least one value is non-zero
      const finalServings = (servingsToAssign === 0 && imagesToAssign === 0) ? 1 : servingsToAssign;

      console.log('Direct package assignment for affiliate:', {
        packageId,
        packageName: selectedPkg.package_name,
        servingsToAssign: finalServings,
        imagesToAssign,
        affiliateId
      });

      // Use the affiliate package assignment mutation
      await assignPackageMutation.mutateAsync({
        packageId,
        affiliateId,
        servings: finalServings
      });

      // Update selected package
      setSelectedPackageId(packageId);
      
      toast.success(`החבילה "${selectedPkg.package_name}" הוקצתה בהצלחה לשותף!`);
      
    } catch (error) {
      console.error('Package assignment error:', error);
      toast.error(`שגיאה בהקצאת החבילה: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAssigningPackageId(null);
    }
  };

  // Package deletion mutation
  const deleteMutation = useMutation({
    mutationFn: deletePackage,
    onSuccess: () => {
      toast.success('החבילה נמחקה בהצלחה');
      setDeleteDialogPackage(null);
      invalidateCache();
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

  const handlePackageCreated = () => {
    setIsCreatingPackage(false);
    setEditingPackage(null);
    invalidateCache();
  };

  const handleEditPackage = (pkg: PackageType) => {
    setEditingPackage(pkg);
  };

  // Refresh all data
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['affiliate-detail', affiliateId] });
      await queryClient.invalidateQueries({ queryKey: ['affiliates'] });
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      await queryClient.invalidateQueries({ queryKey: ['affiliate-assigned-packages'] });
      toast.success('הנתונים רוענו בהצלחה');
    } catch (error) {
      toast.error('שגיאה ברענון הנתונים');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">טוען חבילות...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Current Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">מצב חבילות נוכחי</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllData}
                disabled={isRefreshing}
                title="רענן נתונים"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentAffiliate.remaining_servings || 0}
                </div>
                <div className="text-sm text-blue-600">מנות שנותרו</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {currentAffiliate.remaining_images || 0}
                </div>
                <div className="text-sm text-green-600">תמונות שנותרו</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {currentAffiliate.consumed_images || 0}
                </div>
                <div className="text-sm text-purple-600">תמונות שנוצלו</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {currentAffiliate.reserved_images || 0}
                </div>
                <div className="text-sm text-orange-600">תמונות בשמורה</div>
              </div>
            </div>
            
            {currentAffiliate.current_package_id ? (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">חבילה מוקצית</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Package ID: {currentAffiliate.current_package_id}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">אין חבילה מוקצית</span>
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  יש להקצות חבילה לשותף כדי להתחיל לעבוד
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Package Assignment Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">הקצאת חבילות</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  בחר חבילה להקצאה לשותף
                </p>
              </div>
              <Button
                onClick={() => setIsCreatingPackage(true)}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                צור חבילה חדשה
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {packages && packages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {packages
                  .filter(pkg => pkg.is_active)
                  .map((pkg) => (
                    <div
                      key={pkg.package_id}
                      className={`relative p-4 border rounded-lg transition-all cursor-pointer group ${
                        currentAffiliate.current_package_id === pkg.package_id
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
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">{pkg.package_name}</h3>
                          {currentAffiliate.current_package_id === pkg.package_id && (
                            <Badge variant="default" className="bg-green-600">
                              מוקצית
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {pkg.total_servings || 0} מנות
                            </span>
                            <span className="flex items-center gap-1">
                              <Image className="h-4 w-4" />
                              {pkg.total_images ?? 0} תמונות
                            </span>
                          </div>
                          <div className="mt-2 text-lg font-bold text-blue-600">
                            ₪{(pkg.price || 0).toLocaleString()}
                          </div>
                        </div>

                        {pkg.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {pkg.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPackage(pkg);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePackage(pkg);
                          }}
                          disabled={deleteMutation.isPending && deleteDialogPackage?.package_id === pkg.package_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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