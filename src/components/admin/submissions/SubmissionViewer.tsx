import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  SubmissionCommentType,
  ImageViewMode,
  SUBMISSION_STATUSES,
  SubmissionStatusKey
} from '@/types/submission';

// Custom hooks - use admin-specific hooks for admin/editor views
import {
  useAdminSubmission,
  useAdminSubmissionComments,
  useAdminUpdateSubmissionStatus,
  useAdminUpdateSubmissionLora,
  useAdminAddSubmissionComment
} from '@/hooks/useAdminSubmissions';

// Customer hooks for client view
import {
  useSubmission,
  useSubmissionComments,
  useUpdateSubmissionStatus,
  useUpdateSubmissionLora,
  useAddSubmissionComment
} from '@/hooks/useSubmissions';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import LightboxDialog from '@/components/editor/submission/LightboxDialog';
import { useLightbox } from '@/components/editor/submission-processing/hooks/useLightbox';
import { downloadImagesAsZip } from '@/utils/downloadUtils';
import { supabase } from '@/integrations/supabase/client';

// Icons
import {
  Camera,
  Sparkles,
  Download,
  Share,
  Copy,
  Save,
  Upload,
  User,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Wand2,
  ArrowRight,
  Palette,
  Eye,
  FileImage,
  FileText,
  Tag,
  Beaker,
} from 'lucide-react';

interface SubmissionViewerProps {
  submissionId: string;
  viewMode: 'admin' | 'client' | 'editor';
  context: 'lead-panel' | 'full-page' | 'table-row' | 'client-dashboard';
  onClose?: () => void;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submissionId,
  viewMode,
  context,
  onClose
}) => {
  // State management
  const [imageViewMode, setImageViewMode] = useState<ImageViewMode>('comparison');
  const [activeCommentTab, setActiveCommentTab] = useState<SubmissionCommentType>('admin_internal');
  const [newComment, setNewComment] = useState('');
  const [editingLoraFields, setEditingLoraFields] = useState(false);
  const [loraData, setLoraData] = useState({
    lora_link: '',
    lora_name: '',
    fixed_prompt: '',
    lora_id: ''
  });

  // Processed images upload state
  const [showProcessedImageUpload, setShowProcessedImageUpload] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState('');
  const [isUploadingProcessed, setIsUploadingProcessed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const { lightboxImage, setLightboxImage } = useLightbox();

  // Custom hooks - conditionally use admin hooks for admin/editor views
  const useSubmissionHook = (viewMode === 'admin' || viewMode === 'editor') ? useAdminSubmission : useSubmission;
  const useCommentsHook = (viewMode === 'admin' || viewMode === 'editor') ? useAdminSubmissionComments : useSubmissionComments;
  const useUpdateStatusHook = (viewMode === 'admin' || viewMode === 'editor') ? useAdminUpdateSubmissionStatus : useUpdateSubmissionStatus;
  const useUpdateLoraHook = (viewMode === 'admin' || viewMode === 'editor') ? useAdminUpdateSubmissionLora : useUpdateSubmissionLora;
  const useAddCommentHook = (viewMode === 'admin' || viewMode === 'editor') ? useAdminAddSubmissionComment : useAddSubmissionComment;

  const { data: submission, isLoading, error, refetch: refetchSubmission } = useSubmissionHook(submissionId);
  const { data: comments = [] } = useCommentsHook(submissionId);
  const updateStatusMutation = useUpdateStatusHook();
  const updateLoraMutation = useUpdateLoraHook();
  const addCommentMutation = useAddCommentHook();

  // Initialize LoRA data when submission loads
  useEffect(() => {
    if (submission) {
      setLoraData({
        lora_link: submission.lora_link || '',
        lora_name: submission.lora_name || '',
        fixed_prompt: submission.fixed_prompt || '',
        lora_id: submission.lora_id || ''
      });
    }
  }, [submission]);

  // Handle status update
  const handleStatusUpdate = (newStatus: SubmissionStatusKey) => {
    updateStatusMutation.mutate({ submissionId, status: newStatus });
  };

  // Handle LoRA update
  const handleLoraUpdate = () => {
    updateLoraMutation.mutate({ submissionId, loraData });
    setEditingLoraFields(false);
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const visibility = activeCommentTab === 'client_visible' ? 'client' : 'admin';
    addCommentMutation.mutate({
      submissionId,
      commentType: activeCommentTab,
      commentText: newComment,
      visibility
    });
    setNewComment('');
  };

  // Get comments by type
  const getCommentsByType = (type: SubmissionCommentType) => {
    return comments.filter(comment => comment.comment_type === type);
  };

  // Handle download all original images
  const handleDownloadAllOriginalImages = async () => {
    if (!submission.original_image_urls || submission.original_image_urls.length === 0) {
      toast.error("אין תמונות מקור להורדה");
      return;
    }

    try {
      toast("מתחיל הורדת התמונות...", { duration: 2000 });
      const fileName = `${submission.item_name_at_submission || 'submission'}_original_images.zip`;
      await downloadImagesAsZip(submission.original_image_urls, fileName);
      toast.success(`הורדת ${submission.original_image_urls.length} תמונות הושלמה בהצלחה`);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error("שגיאה בהורדת התמונות");
    }
  };

  // Handle processed image upload via URL
  const handleProcessedImageUrlUpload = async () => {
    if (!processedImageUrl.trim()) {
      toast.error("יש להזין URL של תמונה");
      return;
    }

    setIsUploadingProcessed(true);
    try {
      // Update the processed images array
      const currentProcessedImages = submission.processed_image_urls || [];
      const updatedProcessedImages = [...currentProcessedImages, processedImageUrl];

      const { error } = await supabase
        .from('customer_submissions')
        .update({ 
          processed_image_urls: updatedProcessedImages,
          main_processed_image_url: updatedProcessedImages[0] // Set first as main if none exists
        })
        .eq('submission_id', submissionId);

      if (error) throw error;

      toast.success("תמונה מעובדת נוספה בהצלחה");
      setProcessedImageUrl('');
      setShowProcessedImageUpload(false);
      
      // Refresh the submission data without reloading the page
      await refetchSubmission();
    } catch (error) {
      console.error('Error adding processed image:', error);
      toast.error("שגיאה בהוספת התמונה המעובדת");
    } finally {
      setIsUploadingProcessed(false);
    }
  };

  // Handle processed image file upload
  const handleProcessedImageFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("יש לבחור קובץ תמונה");
      return;
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      toast.error("גודל הקובץ חייב להיות קטן מ-25MB");
      return;
    }

    setIsUploadingProcessed(true);
    try {
      toast("מעלה תמונה...", { duration: 2000 });
      
      // Create unique file name using similar structure to existing uploads
      const fileExt = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const fileName = `processed_${timestamp}.${fileExt}`;
      const filePath = `uploads/${submissionId}/${fileName}`;

      console.log('Uploading file:', fileName, 'Path:', filePath, 'Size:', file.size);

      // Upload to Supabase Storage using same structure as original images
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite in case of retry
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Update the processed images array
      const currentProcessedImages = submission.processed_image_urls || [];
      const updatedProcessedImages = [...currentProcessedImages, publicUrl];
      
      // Set main processed image if this is the first one
      const mainProcessedImageUrl = submission.main_processed_image_url || publicUrl;

      const { error: updateError } = await supabase
        .from('customer_submissions')
        .update({ 
          processed_image_urls: updatedProcessedImages,
          main_processed_image_url: mainProcessedImageUrl
        })
        .eq('submission_id', submissionId);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      toast.success("תמונה מעובדת הועלתה בהצלחה");
      setShowProcessedImageUpload(false);
      
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Refresh the submission data without reloading the page
      await refetchSubmission();
    } catch (error) {
      console.error('Error uploading processed image:', error);
      toast.error(`שגיאה בהעלאת התמונה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    } finally {
      setIsUploadingProcessed(false);
    }
  };

  // Handle download single processed image
  const handleDownloadProcessedImage = async (imageUrl: string) => {
    try {
      toast("מתחיל הורדת תמונה...", { duration: 1000 });
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `processed_image_${Date.now()}.jpg`;
      link.target = '_blank'; // Open in new tab as fallback
      link.rel = 'noopener noreferrer';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("התמונה הורדה בהצלחה");
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error("שגיאה בהורדת התמונה");
      
      // Fallback: open in new tab
      try {
        window.open(imageUrl, '_blank');
        toast("התמונה נפתחת בחלון חדש");
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">שגיאה בטעינת פרטי ההגשה</p>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-2">
              סגור
            </Button>
          )}
        </div>
      </div>
    );
  }

  const statusInfo = SUBMISSION_STATUSES[submission.submission_status as SubmissionStatusKey];

  return (
    <div className={`min-h-screen bg-gray-50 ${context === 'lead-panel' ? 'max-h-screen overflow-y-auto' : ''}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onClose && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="flex items-center gap-2 hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowRight className="h-5 w-5" />
                  <span className="hidden sm:inline">חזרה</span>
                </Button>
              )}
              <h1 className="text-2xl font-bold text-gray-900">
                {submission.item_name_at_submission}
              </h1>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {viewMode === 'admin' && (
                <Select
                  value={submission.submission_status}
                  onValueChange={handleStatusUpdate}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUBMISSION_STATUSES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                ייצא
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 ml-2" />
                שתף
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 ml-2" />
                שכפל
              </Button>
              <Button 
                size="sm"
                onClick={handleLoraUpdate}
                disabled={!editingLoraFields || updateLoraMutation.isPending}
              >
                <Save className="h-4 w-4 ml-2" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Images Section - Most Important */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                תמונות המנה
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={imageViewMode === 'comparison' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('comparison')}
                >
                  השוואה
                </Button>
                <Button
                  variant={imageViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('grid')}
                >
                  רשת
                </Button>
                <Button
                  variant={imageViewMode === 'gallery' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('gallery')}
                >
                  גלריה
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${imageViewMode === 'comparison' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Original Images Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">תמונות מקור</h3>
                    {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                      <Badge variant="outline">{submission.original_image_urls.length}</Badge>
                    )}
                  </div>
                  {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadAllOriginalImages}
                      className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">הורד הכל</span>
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                  {submission.original_image_urls?.map((url, index) => (
                    <div key={index} className="aspect-square bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                      <img 
                        src={url} 
                        alt={`תמונה מקורית ${index + 1}`}
                        className="w-full h-full object-cover"
                        onClick={() => setLightboxImage(url)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Processed Images Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold">תמונות מעובדות</h3>
                  </div>
                  {viewMode === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProcessedImageUpload(!showProcessedImageUpload)}
                      disabled={isUploadingProcessed}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      הוסף תמונה
                    </Button>
                  )}
                </div>

                {/* Upload Controls */}
                {showProcessedImageUpload && viewMode === 'admin' && (
                  <div className="mb-4 p-4 bg-white rounded-lg border">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="image-url">הוסף תמונה מ-URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id="image-url"
                            placeholder="הכנס URL של תמונה..."
                            value={processedImageUrl}
                            onChange={(e) => setProcessedImageUrl(e.target.value)}
                            disabled={isUploadingProcessed}
                          />
                                                     <Button
                             onClick={handleProcessedImageUrlUpload}
                             disabled={isUploadingProcessed || !processedImageUrl.trim()}
                           >
                             {isUploadingProcessed ? (
                               <>
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                 מוסיף...
                               </>
                             ) : (
                               'הוסף'
                             )}
                           </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-300"></div>
                        <span className="text-sm text-gray-500">או</span>
                        <div className="flex-1 h-px bg-gray-300"></div>
                      </div>
                      
                      <div>
                        <Label>העלה תמונה מהמחשב</Label>
                                                 <input
                           ref={fileInputRef}
                           type="file"
                           accept="image/*"
                           onChange={async (e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               console.log('File selected:', file.name, file.size, file.type);
                               await handleProcessedImageFileUpload(file);
                             }
                           }}
                           className="hidden"
                           disabled={isUploadingProcessed}
                         />
                                                 <Button
                           variant="outline"
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isUploadingProcessed}
                           className="w-full"
                         >
                           {isUploadingProcessed ? (
                             <>
                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                               מעלה תמונה...
                             </>
                           ) : (
                             <>
                               <Upload className="h-4 w-4 mr-2" />
                               בחר קובץ תמונה
                             </>
                           )}
                         </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                  {submission.processed_image_urls?.map((url, index) => (
                    <div 
                      key={index} 
                      className={`relative aspect-square bg-white rounded-lg border-2 overflow-hidden hover:scale-105 transition-transform group ${
                        url === submission.main_processed_image_url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`תמונה מעובדת ${index + 1}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleDownloadProcessedImage(url)}
                      />
                      
                      {/* Download button overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadProcessedImage(url);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {url === submission.main_processed_image_url && (
                        <Badge className="absolute top-2 right-2 bg-blue-500">
                          ראשית
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {/* Simplified Upload Area for empty state */}
                  {viewMode === 'admin' && (!submission.processed_image_urls || submission.processed_image_urls.length === 0) && (
                    <div 
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 cursor-pointer transition-colors"
                      onClick={() => setShowProcessedImageUpload(true)}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">העלה תמונה מעובדת</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Materials Section */}
        {((submission.branding_material_urls && submission.branding_material_urls.length > 0) || 
          (submission.reference_example_urls && submission.reference_example_urls.length > 0)) && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                פרטים נוספים
                <Badge variant="outline">
                  {(submission.branding_material_urls?.length || 0) + (submission.reference_example_urls?.length || 0)} קבצים
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                
                {/* Branding Materials */}
                {submission.branding_material_urls && submission.branding_material_urls.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Palette className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold text-purple-800">חומרי מיתוג</h3>
                      <Badge variant="outline" className="text-purple-600 border-purple-300">
                        {submission.branding_material_urls.length} קבצים
                      </Badge>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
                      {submission.branding_material_urls.map((url, index) => {
                        const fileName = url.split('/').pop() || `קובץ ${index + 1}`;
                        const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
                        const isPdf = url.toLowerCase().endsWith('.pdf');
                        
                        return (
                          <div key={index} className="bg-white rounded-lg border border-purple-200 overflow-hidden hover:scale-105 transition-transform">
                            {isImage ? (
                              <div className="aspect-square">
                                <img 
                                  src={url} 
                                  alt={`חומר מיתוג ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => setLightboxImage(url)}
                                />
                              </div>
                            ) : (
                              <div className="aspect-square flex flex-col items-center justify-center bg-purple-100">
                                {isPdf ? (
                                  <FileText className="h-8 w-8 text-purple-600 mb-2" />
                                ) : (
                                  <FileImage className="h-8 w-8 text-purple-600 mb-2" />
                                )}
                                <span className="text-xs text-purple-700 text-center px-2 truncate">
                                  {fileName}
                                </span>
                              </div>
                            )}
                            <div className="p-2 bg-purple-50">
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                <span className="truncate">{fileName}</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reference Examples */}
                {submission.reference_example_urls && submission.reference_example_urls.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Eye className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold text-green-800">דוגמאות להתייחסות</h3>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        {submission.reference_example_urls.length} קבצים
                      </Badge>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
                      {submission.reference_example_urls.map((url, index) => {
                        const fileName = url.split('/').pop() || `קובץ ${index + 1}`;
                        const isImage = url.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
                        const isPdf = url.toLowerCase().endsWith('.pdf');
                        
                        return (
                          <div key={index} className="bg-white rounded-lg border border-green-200 overflow-hidden hover:scale-105 transition-transform">
                            {isImage ? (
                              <div className="aspect-square">
                                <img 
                                  src={url} 
                                  alt={`דוגמת התייחסות ${index + 1}`}
                                  className="w-full h-full object-cover cursor-pointer"
                                  onClick={() => setLightboxImage(url)}
                                />
                              </div>
                            ) : (
                              <div className="aspect-square flex flex-col items-center justify-center bg-green-100">
                                {isPdf ? (
                                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                                ) : (
                                  <FileImage className="h-8 w-8 text-green-600 mb-2" />
                                )}
                                <span className="text-xs text-green-700 text-center px-2 truncate">
                                  {fileName}
                                </span>
                              </div>
                            )}
                            <div className="p-2 bg-green-50">
                              <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 transition-colors"
                              >
                                <Download className="h-3 w-3" />
                                <span className="truncate">{fileName}</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submission Details Section - NEW */}
        {(submission.description || submission.category || (submission.ingredients && submission.ingredients.length > 0)) && (
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                פרטי התוכן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                
                {/* Description */}
                {submission.description && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">תיאור/מרכיבים</h4>
                    </div>
                    <p className="text-sm text-blue-900 whitespace-pre-wrap">{submission.description}</p>
                  </div>
                )}

                {/* Category */}
                {submission.category && (
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-amber-600" />
                      <h4 className="font-medium text-amber-800">קטגוריה</h4>
                    </div>
                    <p className="text-sm text-amber-900">{submission.category}</p>
                  </div>
                )}

                {/* Ingredients Array (for cocktails) */}
                {submission.ingredients && submission.ingredients.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Beaker className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">מרכיבים</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {submission.ingredients.map((ingredient, index) => (
                        <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Grid - Responsive Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטי ההגשה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">סוג פריט</Label>
                <p className="text-sm font-medium">{submission.item_type}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">תאריך הגשה</Label>
                <p className="text-sm font-medium">
                  {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">עדיפות</Label>
                <p className="text-sm font-medium">{submission.priority || 'רגילה'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">עורך מוקצה</Label>
                <p className="text-sm font-medium">{submission.assigned_editor_id || 'לא הוקצה'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Client/Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                פרטי {submission.clients ? 'לקוח' : 'ליד'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.clients && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">שם מסעדה</Label>
                    <p className="text-sm font-medium">{submission.clients.restaurant_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">איש קשר</Label>
                    <p className="text-sm font-medium">{submission.clients.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.clients.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.clients.phone}</p>
                  </div>
                </>
              )}
              {submission.leads && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">שם מסעדה</Label>
                    <p className="text-sm font-medium">{submission.leads.restaurant_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">איש קשר</Label>
                    <p className="text-sm font-medium">{submission.leads.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.leads.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.leads.phone}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Original Submission Contact Info (if available) */}
          {(submission.contact_name || submission.email || submission.phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרטי יצירת קשר מהטופס
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.contact_name && (
                  <div>
                    <Label className="text-xs text-gray-500">שם איש קשר</Label>
                    <p className="text-sm font-medium">{submission.contact_name}</p>
                  </div>
                )}
                {submission.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.email}</p>
                  </div>
                )}
                {submission.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI & LoRA Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                הגדרות AI & LoRA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="lora-link" className="text-xs text-gray-500">קישור LoRA</Label>
                  <Input
                    id="lora-link"
                    value={loraData.lora_link}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, lora_link: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="הזן קישור LoRA"
                    className="mt-1"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
                <div>
                  <Label htmlFor="lora-name" className="text-xs text-gray-500">שם LoRA</Label>
                  <Input
                    id="lora-name"
                    value={loraData.lora_name}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, lora_name: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="שם תיאורי של LoRA"
                    className="mt-1"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
                <div>
                  <Label htmlFor="lora-id" className="text-xs text-gray-500">מזהה LoRA</Label>
                  <Input
                    id="lora-id"
                    value={loraData.lora_id}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, lora_id: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="מזהה LoRA (טקסט חופשי)"
                    className="mt-1"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
                <div>
                  <Label htmlFor="fixed-prompt" className="text-xs text-gray-500">Prompt קבוע</Label>
                  <Textarea
                    id="fixed-prompt"
                    value={loraData.fixed_prompt}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, fixed_prompt: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="כתוב את ה-prompt המותאם אישית..."
                    className="mt-1 font-mono text-sm min-h-[100px]"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              מערכת הערות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCommentTab} onValueChange={(value) => setActiveCommentTab(value as SubmissionCommentType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin_internal" className="flex items-center gap-2">
                  הערות פנימיות
                  <Badge variant="destructive" className="text-xs">
                    {getCommentsByType('admin_internal').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="client_visible" className="flex items-center gap-2">
                  הערות ללקוח
                  <Badge variant="default" className="text-xs bg-green-500">
                    {getCommentsByType('client_visible').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="editor_note" className="flex items-center gap-2">
                  הערות לעורך
                  <Badge variant="default" className="text-xs bg-blue-500">
                    {getCommentsByType('editor_note').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Comment Input */}
              {viewMode === 'admin' && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`כתוב הערה ${activeCommentTab === 'admin_internal' ? 'פנימית' : 
                      activeCommentTab === 'client_visible' ? 'ללקוח' : 'לעורך'}...`}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    שלח הערה
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <TabsContent value={activeCommentTab} className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getCommentsByType(activeCommentTab).map((comment) => (
                    <div key={comment.comment_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.created_by_user?.email || 'משתמש לא ידוע'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                  ))}
                  {getCommentsByType(activeCommentTab).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>אין הערות עדיין</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              היסטוריית סטטוס
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{statusInfo.label}</span>
                    <span className="text-sm text-gray-500">עכשיו</span>
                  </div>
                  <p className="text-sm text-gray-600">סטטוס נוכחי</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">הגשה התקבלה</span>
                    <span className="text-sm text-gray-500">
                      {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ההגשה נוצרה במערכת</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      <LightboxDialog
        imageUrl={lightboxImage}
        onClose={() => setLightboxImage(null)}
        open={!!lightboxImage}
      />
    </div>
  );
}; 