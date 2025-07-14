import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Package, Plus, RefreshCw, Edit, CheckCircle, Trash2, AlertCircle, Minus, FileImage, TrendingUp, Image, Clock, Info } from 'lucide-react';
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
  
  // Manual quantity state
  const [editingServings, setEditingServings] = useState(false);
  const [editingImages, setEditingImages] = useState(false);
  const [tempServings, setTempServings] = useState(0);
  const [tempImages, setTempImages] = useState(0);
  
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
  
  // Update selected package and temp values when current affiliate data changes
  useEffect(() => {
    if (currentAffiliate?.current_package_id !== selectedPackageId) {
      setSelectedPackageId(currentAffiliate?.current_package_id || null);
    }
    setTempServings(currentAffiliate?.remaining_servings || 0);
    setTempImages(currentAffiliate?.remaining_images || 0);
  }, [currentAffiliate?.current_package_id, currentAffiliate?.remaining_servings, currentAffiliate?.remaining_images, selectedPackageId]);

  // Quantity adjustment functions
  const adjustServings = (delta: number) => {
    const newValue = Math.max(0, tempServings + delta);
    setTempServings(newValue);
    updateServingsMutation.mutate({ affiliateId, newServings: newValue });
  };

  const adjustImages = (delta: number) => {
    const newValue = Math.max(0, tempImages + delta);
    setTempImages(newValue);
    updateImagesMutation.mutate({ affiliateId, newImages: newValue });
  };

  const handleServingsInputChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setTempServings(numValue);
  };

  const handleImagesInputChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setTempImages(numValue);
  };

  const saveServings = () => {
    updateServingsMutation.mutate({ affiliateId, newServings: tempServings });
    setEditingServings(false);
  };

  const saveImages = () => {
    updateImagesMutation.mutate({ affiliateId, newImages: tempImages });
    setEditingImages(false);
  };
  
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
        {/* Header with refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-600" />
            <h2 className="text-xl font-semibold">חבילה נוכחית</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshAllData}
            disabled={isRefreshing}
            className="border-gray-200"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Current Package Status Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Active Package Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">חבילה מוקצית</h3>
                {currentAffiliate.current_package_id ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-700">פעיל</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      מזהה חבילה: {currentAffiliate.current_package_id.substring(0, 8)}...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="font-medium text-gray-600">לא מוקצית</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      יש להקצות חבילה לשותף
                    </div>
                  </div>
                )}
              </div>

              {/* Manual Quantity Controls */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">מנות שנותרו</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustServings(-5)}
                    disabled={updateServingsMutation.isPending}
                    className="w-8 h-8 rounded-full p-0 border-gray-300"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="flex items-center">
                    {editingServings ? (
                      <Input
                        value={tempServings}
                        onChange={(e) => handleServingsInputChange(e.target.value)}
                        onBlur={saveServings}
                        onKeyDown={(e) => e.key === 'Enter' && saveServings()}
                        className="w-16 h-10 text-center text-lg font-bold border-0 bg-purple-100 text-purple-800"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold cursor-pointer hover:bg-purple-700 transition-colors"
                        onClick={() => setEditingServings(true)}
                      >
                        {currentAffiliate.remaining_servings || 0}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustServings(5)}
                    disabled={updateServingsMutation.isPending}
                    className="w-8 h-8 rounded-full p-0 border-gray-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <div className="text-xs text-gray-500">
                    <div>-5</div>
                    <div>+5</div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid grid-cols-2 gap-6">
              {/* Images Section */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">תמונות שנותרו</h3>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustImages(-5)}
                    disabled={updateImagesMutation.isPending}
                    className="w-8 h-8 rounded-full p-0 border-gray-300"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <div className="flex items-center">
                    {editingImages ? (
                      <Input
                        value={tempImages}
                        onChange={(e) => handleImagesInputChange(e.target.value)}
                        onBlur={saveImages}
                        onKeyDown={(e) => e.key === 'Enter' && saveImages()}
                        className="w-16 h-10 text-center text-lg font-bold border-0 bg-purple-100 text-purple-800"
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold cursor-pointer hover:bg-purple-700 transition-colors"
                        onClick={() => setEditingImages(true)}
                      >
                        {currentAffiliate.remaining_images || 0}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustImages(5)}
                    disabled={updateImagesMutation.isPending}
                    className="w-8 h-8 rounded-full p-0 border-gray-300"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <div className="text-xs text-gray-500">
                    <div>-5</div>
                    <div>+5</div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">סטטיסטיקות</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">בהגשות:</span>
                    </div>
                    <span className="font-bold text-blue-600">3</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">ממתינות:</span>
                    </div>
                    <span className="font-bold text-orange-600">3</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Package Assignment Section */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">הקצאת חבילות חדשות</CardTitle>
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
                      className={`relative p-4 border rounded-xl transition-all cursor-pointer group hover:shadow-lg ${
                        currentAffiliate.current_package_id === pkg.package_id
                          ? 'border-green-500 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => !assigningPackageId && handleDirectPackageAssignment(pkg.package_id)}
                    >
                      {/* Loading Overlay */}
                      {assigningPackageId === pkg.package_id && (
                        <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-xl">
                          <div className="flex items-center gap-2 text-purple-600">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                            <span className="font-medium">מקצה חבילה...</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Package Content */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 text-lg">{pkg.package_name}</h3>
                          {currentAffiliate.current_package_id === pkg.package_id && (
                            <Badge className="bg-green-600 text-white">
                              מוקצית
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Package className="h-4 w-4" />
                              <span className="text-sm">{pkg.total_servings || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Image className="h-4 w-4" />
                              <span className="text-sm">{pkg.total_images ?? 0}</span>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-purple-600">
                            ₪{(pkg.price || 0).toLocaleString()}
                          </div>
                        </div>

                        {pkg.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {pkg.description}
                          </p>
                        )}

                        {/* Assign Button */}
                        <div className="pt-2 border-t border-gray-100">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600 group-hover:text-purple-700">
                              הקצה חבילה
                            </span>
                          </div>
                        </div>
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
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-8 h-8 p-0"
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
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0"
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
              <div className="text-center py-12 text-gray-500">
                <Package className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">לא נמצאו חבילות פעילות במערכת</p>
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