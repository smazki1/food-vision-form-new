import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Plus,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Upload,
  Link,
  Trash2,
  X
} from 'lucide-react';
import { Client } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClientSubmissions, useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import { useSubmissionNotes } from '@/hooks/useSubmissionNotes';
import { useLoraDetails } from '@/hooks/useLoraDetails';
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { StatusSelector } from './StatusSelector';
import { useAdminSubmissionComments, useAdminAddSubmissionComment } from '@/hooks/useAdminSubmissions';
import { SubmissionCommentType } from '@/types/submission';
import { MessageSquare } from 'lucide-react';

interface ClientSubmissions2Props {
  clientId: string;
  client: Client;
}

// Work Sessions History Component
const WorkSessionsHistory: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchWorkSessions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('work_sessions')
          .select('*')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Error fetching work sessions:', error);
        } else {
          setWorkSessions(data || []);
        }
      } catch (error) {
        console.error('Error fetching work sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkSessions();

    // Listen for work session saved events
    const handleWorkSessionSaved = (event: CustomEvent) => {
      if (event.detail.clientId === clientId) {
        fetchWorkSessions();
      }
    };

    window.addEventListener('work-session-saved', handleWorkSessionSaved as EventListener);

    return () => {
      window.removeEventListener('work-session-saved', handleWorkSessionSaved as EventListener);
    };
  }, [clientId]);

  if (loading) {
    return (
      <div className="pt-3 border-t">
        <div className="text-xs text-gray-500">טוען פעילות עבודה...</div>
      </div>
    );
  }

  if (workSessions.length === 0) {
    return (
      <div className="pt-3 border-t">
        <div className="text-xs text-gray-500">אין פעילות עבודה רשומה</div>
      </div>
    );
  }

  const refreshSessions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_sessions')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching work sessions:', error);
      } else {
        setWorkSessions(data || []);
      }
    } catch (error) {
      console.error('Error fetching work sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3 border-t">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-medium text-gray-700">פעילות עבודה אחרונה:</div>
        <button 
          onClick={refreshSessions}
          className="text-xs text-blue-600 hover:text-blue-800"
          disabled={loading}
        >
          {loading ? 'טוען...' : 'רענן'}
        </button>
      </div>
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {workSessions.map((session, index) => (
          <div key={session.id || index} className="text-xs border-b border-gray-100 pb-1">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">
                {new Date(session.created_at).toLocaleDateString('he-IL', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span className="font-mono bg-gray-100 px-1 rounded">
                {session.duration_minutes >= 60 
                  ? `${Math.floor(session.duration_minutes / 60)}:${(session.duration_minutes % 60).toString().padStart(2, '0')}`
                  : `${session.duration_minutes}m`
                }
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-blue-600 font-medium">{session.work_type}</span>
              {session.description && (
                <span className="text-gray-500 text-xs truncate max-w-20" title={session.description}>
                  {session.description}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Add Image Upload Modal Component
const AddProcessedImageModal: React.FC<{
  submissionId: string;
  onImageAdded: () => void;
  isOverlay?: boolean;
}> = ({ submissionId, onImageAdded, isOverlay = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${submissionId}_processed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `processed/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('food-vision-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('food-vision-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const uploadMultipleFiles = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(file => uploadFileToStorage(file));
    return Promise.all(uploadPromises);
  };

  const updateSubmissionImages = async (newImageUrls: string[]) => {
    // Get current submission data
    const { data: submission, error: fetchError } = await supabase
      .from('customer_submissions')
      .select('processed_image_urls')
      .eq('submission_id', submissionId)
      .single();

    if (fetchError) throw fetchError;

    const currentImages = submission.processed_image_urls || [];
    const updatedImages = [...currentImages, ...newImageUrls];

    const { error: updateError } = await supabase
      .from('customer_submissions')
      .update({ processed_image_urls: updatedImages })
      .eq('submission_id', submissionId);

    if (updateError) throw updateError;
  };

  const handleSubmit = async () => {
    if (!submissionId) return;

    setIsUploading(true);
    try {
      let finalImageUrls: string[] = [];

      if (uploadMethod === 'file' && selectedFiles.length > 0) {
        finalImageUrls = await uploadMultipleFiles(selectedFiles);
      } else if (uploadMethod === 'url' && imageUrl.trim()) {
        finalImageUrls = [imageUrl.trim()];
      } else {
        toast.error('אנא בחר קבצים או הכנס קישור');
        return;
      }

      await updateSubmissionImages(finalImageUrls);
      
      const imageCount = finalImageUrls.length;
      toast.success(`${imageCount} תמונות נוספו בהצלחה`);
      onImageAdded();
      setIsOpen(false);
      setImageUrl('');
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error adding processed images:', error);
      toast.error('שגיאה בהוספת התמונות');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {isOverlay ? (
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/90 hover:bg-white text-green-600 hover:text-green-700 border border-green-200 shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-2 border-dashed border-green-300 hover:border-green-400 rounded-lg flex flex-col items-center justify-center gap-3 text-green-700 hover:text-green-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="p-3 bg-white rounded-full shadow-sm">
              <Plus className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold">הוסף תמונה מעובדת</span>
            <span className="text-xs text-green-600 opacity-75">לחץ להעלאה</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף תמונה מעובדת</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'url')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                העלאת קובץ
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                קישור
              </TabsTrigger>
            </TabsList>
            
                         <TabsContent value="file" className="space-y-3">
               <div>
                 <label className="block text-sm font-medium mb-2">בחר קבצי תמונות</label>
                 <Input
                   type="file"
                   accept="image/*"
                   multiple
                   onChange={handleFileSelect}
                   className="cursor-pointer"
                 />
                 {selectedFiles.length > 0 && (
                   <div className="text-sm text-gray-600 mt-1">
                     <p>נבחרו {selectedFiles.length} קבצים:</p>
                     <ul className="list-disc list-inside max-h-20 overflow-y-auto">
                       {selectedFiles.map((file, index) => (
                         <li key={index} className="truncate">{file.name}</li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             </TabsContent>
            
            <TabsContent value="url" className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">קישור לתמונה</label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
          
                     <div className="flex gap-2 pt-4">
             <Button 
               onClick={handleSubmit} 
               disabled={isUploading || (uploadMethod === 'file' && selectedFiles.length === 0) || (uploadMethod === 'url' && !imageUrl.trim())}
               className="flex-1"
             >
               {isUploading ? 'מעלה...' : selectedFiles.length > 1 ? 'הוסף תמונות' : 'הוסף תמונה'}
             </Button>
             <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isUploading}>
               ביטול
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fullscreen Comparison Component
const FullscreenComparison: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  originalImages: string[];
  processedImages: string[];
  originalIndex: number;
  processedIndex: number;
  onNavigateOriginal: (direction: 'prev' | 'next') => void;
  onNavigateProcessed: (direction: 'prev' | 'next') => void;
}> = ({ 
  isOpen, 
  onClose, 
  originalImages, 
  processedImages, 
  originalIndex, 
  processedIndex, 
  onNavigateOriginal, 
  onNavigateProcessed 
}) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 bg-black border-none">
        <div className="relative w-full h-[98vh] flex">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Processed Images Side - Left */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-800">
            <div className="absolute top-4 left-4 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded">
                                      תמונות מוכנות
            </div>
            
            {processedImages.length > 0 ? (
              <>
                <img 
                  src={processedImages[processedIndex]} 
                  alt="תמונה מעובדת"
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation arrows for processed */}
                {processedImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                      onClick={() => onNavigateProcessed('prev')}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                      onClick={() => onNavigateProcessed('next')}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                  </>
                )}
                
                {/* Image counter for processed */}
                {processedImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded">
                    {processedIndex + 1} / {processedImages.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>אין תמונות מוכנות</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px bg-white/20"></div>

          {/* Original Images Side - Right */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-900">
            <div className="absolute top-4 left-4 z-10 text-white text-sm bg-black/50 px-3 py-1 rounded">
              תמונות מקור
            </div>
            
            {originalImages.length > 0 ? (
              <>
                <img 
                  src={originalImages[originalIndex]} 
                  alt="תמונה מקורית"
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation arrows for original */}
                {originalImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                      onClick={() => onNavigateOriginal('prev')}
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                      onClick={() => onNavigateOriginal('next')}
                    >
                      <ChevronLeft className="h-8 w-8" />
                    </Button>
                  </>
                )}
                
                {/* Image counter for original */}
                {originalImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded">
                    {originalIndex + 1} / {originalImages.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>אין תמונות מקור</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Image Lightbox Component
const ImageLightbox: React.FC<{
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}> = ({ imageUrl, isOpen, onClose, images = [], currentIndex = 0, onNavigate }) => {
  const hasMultipleImages = images.length > 1;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!hasMultipleImages || !onNavigate) return;
    
    if (e.key === 'ArrowLeft') {
      onNavigate('next');
    } else if (e.key === 'ArrowRight') {
      onNavigate('prev');
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, hasMultipleImages, onNavigate]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none">
        <div className="relative w-full h-full flex items-center justify-center min-h-[80vh]">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 rounded-full"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
          
          {/* Navigation arrows */}
          {hasMultipleImages && onNavigate && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                onClick={() => onNavigate('prev')}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full"
                onClick={() => onNavigate('next')}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            </>
          )}
          
          <img 
            src={imageUrl} 
            alt="תמונה מוגדלת"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
          
          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 bg-black/50 text-white text-sm px-3 py-1 rounded">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ClientSubmissions2: React.FC<ClientSubmissions2Props> = ({
  clientId,
  client
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerValue, setTimerValue] = useState("00:00:00");
  const [showCosts, setShowCosts] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(0);
  const [showBackgroundImages, setShowBackgroundImages] = useState(false);

  
  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'original' | 'processed'>('original');
  const [isComparisonViewOpen, setIsComparisonViewOpen] = useState(false);
  const [comparisonOriginalIndex, setComparisonOriginalIndex] = useState(0);
  const [comparisonProcessedIndex, setComparisonProcessedIndex] = useState(0);
  const [activeNotesTab, setActiveNotesTab] = useState("self");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Work session form state
  const [workType, setWorkType] = useState("עיצוב");
  const [workDescription, setWorkDescription] = useState("");
  
  // Cost quantities state - initialize from client data
  const [gpt4Quantity, setGpt4Quantity] = useState(client?.ai_training_25_count || 0);
  const [claudeQuantity, setClaudeQuantity] = useState(client?.ai_training_15_count || 0);
  const [dalleQuantity, setDalleQuantity] = useState(client?.ai_training_5_count || 0);
  const [promptsQuantity, setPromptsQuantity] = useState(client?.ai_prompts_count || 0);
  
  // Image navigation state
  const [currentOriginalIndex, setCurrentOriginalIndex] = useState(0);
  const [currentProcessedIndex, setCurrentProcessedIndex] = useState(0);
  
  const queryClient = useQueryClient();

  // Reset image indices when switching submissions
  useEffect(() => {
    setCurrentOriginalIndex(0);
    setCurrentProcessedIndex(0);
  }, [selectedSubmission]);

  // Real submission data
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError, refetch: refetchSubmissions } = useClientSubmissions(clientId);
  const { data: submissionStats } = useClientSubmissionStats(clientId);
  
  // Get current submission ID for notes
  const currentSubmissionId = submissions.length > 0 && selectedSubmission !== null 
    ? submissions[selectedSubmission]?.submission_id 
    : null;
  
  // Use submission notes hook
  const { notes, updateNote, isSaving } = useSubmissionNotes(currentSubmissionId);
  
  // Use LORA details hook
  const { loraDetails, updateLoraField, isSaving: isLoraSaving } = useLoraDetails(currentSubmissionId);
  
  // Use submission status hook
  const { updateSubmissionStatus, isUpdating: isStatusUpdating } = useSubmissionStatus();
  
  // Comments system
  const [activeCommentTab, setActiveCommentTab] = useState<SubmissionCommentType>('admin_internal');
  const [newComment, setNewComment] = useState('');
  const { data: comments = [] } = useAdminSubmissionComments(currentSubmissionId || '');
  const addCommentMutation = useAdminAddSubmissionComment();

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prevSeconds => {
          const newSeconds = prevSeconds + 1;
          // Update display format
          const hours = Math.floor(newSeconds / 3600);
          const minutes = Math.floor((newSeconds % 3600) / 60);
          const seconds = newSeconds % 60;
          setTimerValue(
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          );
          return newSeconds;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning]);

  // Update local state when client data changes
  useEffect(() => {
    if (client) {
      setGpt4Quantity(client.ai_training_25_count || 0);
      setClaudeQuantity(client.ai_training_15_count || 0);
      setDalleQuantity(client.ai_training_5_count || 0);
      setPromptsQuantity(client.ai_prompts_count || 0);
    }
  }, [client]);

  // Function to update client cost data in database
  const updateClientCostField = async (field: string, value: number) => {
    if (!clientId) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      // Update costs report data immediately
      queryClient.invalidateQueries({ queryKey: ['client-costs-report'] });
      queryClient.invalidateQueries({ queryKey: ['ai-costs-report'] });
      
      // Force refetch of costs data only
      queryClient.refetchQueries({ 
        queryKey: ['client-costs-report'],
        type: 'active'
      });
      
      // Update all client cache variations silently without refetch
      const updateClientInCache = (oldData: any) => {
        if (!oldData) return oldData;
        if (Array.isArray(oldData)) {
          return oldData.map((client: any) => 
            client.client_id === clientId ? { ...client, [field]: value } : client
          );
        }
        return oldData.client_id === clientId ? { ...oldData, [field]: value } : oldData;
      };

      queryClient.setQueryData(['clients'], updateClientInCache);
      queryClient.setQueryData(['clients_simplified'], updateClientInCache);
      queryClient.setQueryData(['clients_list_for_admin'], updateClientInCache);
      queryClient.setQueryData(['client', clientId], (oldData: any) => 
        oldData ? { ...oldData, [field]: value } : oldData
      );
      queryClient.setQueryData(['client-detail', clientId], (oldData: any) => 
        oldData ? { ...oldData, [field]: value } : oldData
      );
      
      // Show success message
      toast.success('נתוני העלויות עודכנו בהצלחה');
      
    } catch (error: any) {
      console.error('Error updating client cost field:', error);
      toast.error(`שגיאה בעדכון נתונים: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Cost update handlers with database synchronization
  const handleGpt4Change = async (newValue: number) => {
    setGpt4Quantity(newValue);
    await updateClientCostField('ai_training_25_count', newValue);
  };

  const handleClaudeChange = async (newValue: number) => {
    setClaudeQuantity(newValue);
    await updateClientCostField('ai_training_15_count', newValue);
  };

  const handleDalleChange = async (newValue: number) => {
    setDalleQuantity(newValue);
    await updateClientCostField('ai_training_5_count', newValue);
  };

  const handlePromptsChange = async (newValue: number) => {
    setPromptsQuantity(newValue);
    await updateClientCostField('ai_prompts_count', newValue);
  };

  // Timer control function
  const toggleTimer = async () => {
    if (isTimerRunning) {
      // Timer is stopping - save the session
      if (timerSeconds > 0) {
        await saveWorkSession(timerSeconds, workType, workDescription);
      }
      // Reset timer and form
      setTimerSeconds(0);
      setTimerValue("00:00:00");
      setWorkDescription("");
    }
    setIsTimerRunning(!isTimerRunning);
  };

  // Save work session to database
  const saveWorkSession = async (durationSeconds: number, type: string, description: string) => {
    if (!clientId || durationSeconds === 0) return;
    
    try {
      const durationMinutes = Math.round(durationSeconds / 60);
      const sessionDate = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('work_sessions')
        .insert({
          client_id: clientId,
          duration_minutes: durationMinutes,
          session_date: sessionDate,
          work_type: type,
          description: description || null,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving work session:', error);
        toast.error('שגיאה בשמירת זמן עבודה');
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const timeDisplay = hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')} שעות` : `${minutes} דקות`;
        toast.success(`נשמר זמן עבודה: ${type} - ${timeDisplay}`);
        // Force refresh of work sessions display
        window.dispatchEvent(new CustomEvent('work-session-saved', { detail: { clientId } }));
      }
    } catch (error) {
      console.error('Error saving work session:', error);
      toast.error('שגיאה בשמירת זמן עבודה');
    }
  };
  
  // Calculate individual status counts from real data
  const pendingCount = submissionStats?.byStatus?.['ממתינה לעיבוד'] || 0;
  const inProgressCount = submissionStats?.byStatus?.['בעיבוד'] || 0;
  const readyCount = submissionStats?.byStatus?.['מוכנה להצגה'] || 0;
  const feedbackCount = submissionStats?.byStatus?.['הערות התקבלו'] || 0;
  const completedCount = submissionStats?.byStatus?.['הושלמה ואושרה'] || 0;

  // Mock image data for now - TODO: Replace with real image data from selected submission
  const originalImages = [
    "original1.jpg", "original2.jpg", "original3.jpg"
  ];
  
  const processedImages = [
    "processed1.jpg", "processed2.jpg"
  ];
  
  const backgroundImages = [
    "background1.jpg", "background2.jpg"
  ];

  const handleImageAdded = () => {
    refetchSubmissions();
  };

  const handleDeleteProcessedImage = async (imageUrl: string, submissionId: string) => {
    try {
      // Get current submission data
      const { data: submission, error: fetchError } = await supabase
        .from('customer_submissions')
        .select('processed_image_urls')
        .eq('submission_id', submissionId)
        .single();

      if (fetchError) throw fetchError;

      const currentImages = submission.processed_image_urls || [];
      const updatedImages = currentImages.filter(url => url !== imageUrl);

      const { error: updateError } = await supabase
        .from('customer_submissions')
        .update({ processed_image_urls: updatedImages })
        .eq('submission_id', submissionId);

      if (updateError) throw updateError;

      toast.success('תמונה נמחקה בהצלחה');
      refetchSubmissions();
      
      // Reset image index if we deleted the current image
      if (currentProcessedIndex >= updatedImages.length && updatedImages.length > 0) {
        setCurrentProcessedIndex(updatedImages.length - 1);
      } else if (updatedImages.length === 0) {
        setCurrentProcessedIndex(0);
      }
    } catch (error) {
      console.error('Error deleting processed image:', error);
      toast.error('שגיאה במחיקת התמונה');
    }
  };

  const openLightbox = (imageUrl: string, type: 'original' | 'processed' = 'original') => {
    const currentSubmission = submissions[selectedSubmission];
    if (!currentSubmission) return;

    let images: string[] = [];
    let currentIndex = 0;

    if (type === 'original' && currentSubmission.original_image_urls) {
      images = currentSubmission.original_image_urls;
      currentIndex = images.indexOf(imageUrl);
    } else if (type === 'processed' && currentSubmission.processed_image_urls) {
      images = currentSubmission.processed_image_urls;
      currentIndex = images.indexOf(imageUrl);
    }

    setLightboxImage(imageUrl);
    setLightboxImages(images);
    setLightboxCurrentIndex(Math.max(0, currentIndex));
    setLightboxType(type);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImage(null);
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (lightboxImages.length <= 1) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = lightboxCurrentIndex === 0 ? lightboxImages.length - 1 : lightboxCurrentIndex - 1;
    } else {
      newIndex = lightboxCurrentIndex === lightboxImages.length - 1 ? 0 : lightboxCurrentIndex + 1;
    }

    setLightboxCurrentIndex(newIndex);
    setLightboxImage(lightboxImages[newIndex]);

    // Update the main view index to match lightbox navigation
    if (lightboxType === 'original') {
      setCurrentOriginalIndex(newIndex);
    } else {
      setCurrentProcessedIndex(newIndex);
    }
  };

  const openComparisonView = () => {
    setComparisonOriginalIndex(currentOriginalIndex);
    setComparisonProcessedIndex(currentProcessedIndex);
    setIsComparisonViewOpen(true);
  };

  const closeComparisonView = () => {
    setIsComparisonViewOpen(false);
  };

  const navigateComparisonOriginal = (direction: 'prev' | 'next') => {
    const currentSubmission = submissions[selectedSubmission];
    if (!currentSubmission?.original_image_urls) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = comparisonOriginalIndex === 0 ? currentSubmission.original_image_urls.length - 1 : comparisonOriginalIndex - 1;
    } else {
      newIndex = comparisonOriginalIndex === currentSubmission.original_image_urls.length - 1 ? 0 : comparisonOriginalIndex + 1;
    }
    setComparisonOriginalIndex(newIndex);
  };

  const navigateComparisonProcessed = (direction: 'prev' | 'next') => {
    const currentSubmission = submissions[selectedSubmission];
    if (!currentSubmission?.processed_image_urls) return;

    let newIndex: number;
    if (direction === 'prev') {
      newIndex = comparisonProcessedIndex === 0 ? currentSubmission.processed_image_urls.length - 1 : comparisonProcessedIndex - 1;
    } else {
      newIndex = comparisonProcessedIndex === currentSubmission.processed_image_urls.length - 1 ? 0 : comparisonProcessedIndex + 1;
    }
    setComparisonProcessedIndex(newIndex);
  };

  // Handle status change
  const handleStatusChange = async (newStatus: any) => {
    if (!currentSubmissionId) return;
    
    const success = await updateSubmissionStatus(currentSubmissionId, newStatus);
    if (success) {
      // Refresh submissions data to show updated status
      refetchSubmissions();
    }
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!newComment.trim() || !currentSubmissionId) return;

    // Map comment types to appropriate visibility levels
    const getVisibilityForCommentType = (commentType: SubmissionCommentType): string => {
      switch (commentType) {
        case 'client_visible':
          return 'client';
        case 'admin_internal':
          return 'admin';
        case 'editor_note':
          return 'editor';
        default:
          return 'admin';
      }
    };

    const visibility = getVisibilityForCommentType(activeCommentTab);
    addCommentMutation.mutate({
      submissionId: currentSubmissionId,
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

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Stats (5 cards) - Individual Status Counts */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-xs text-gray-600">ממתינות לעיבוד</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-xs text-gray-600">בעיבוד</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{readyCount}</div>
            <div className="text-xs text-gray-600">מוכנות להצגה</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{feedbackCount}</div>
            <div className="text-xs text-gray-600">הערות התקבלו</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-xs text-gray-600">הושלמו ואושרו</div>
          </CardContent>
        </Card>
      </div>

      {/* Costs Section - Vertical Layout */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">עלויות ותזמון</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCosts(!showCosts)}
            >
              {showCosts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showCosts && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* AI Training Costs - Single Row Layout */}
              <div className="grid grid-cols-4 gap-3">
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-gray-600 text-xs text-center">אימוני AI (2.5$)</span>
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handleGpt4Change(Math.max(0, gpt4Quantity - 1))}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▼
                    </button>
                    <span className="px-2 py-0.5 text-xs min-w-[30px] text-center">{gpt4Quantity}</span>
                    <button 
                      onClick={() => handleGpt4Change(gpt4Quantity + 1)}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▲
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-gray-600 text-xs text-center">אימוני AI (1.5$)</span>
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handleClaudeChange(Math.max(0, claudeQuantity - 1))}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▼
                    </button>
                    <span className="px-2 py-0.5 text-xs min-w-[30px] text-center">{claudeQuantity}</span>
                    <button 
                      onClick={() => handleClaudeChange(claudeQuantity + 1)}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▲
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-gray-600 text-xs text-center">אימוני AI (5$)</span>
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handleDalleChange(Math.max(0, dalleQuantity - 1))}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▼
                    </button>
                    <span className="px-2 py-0.5 text-xs min-w-[30px] text-center">{dalleQuantity}</span>
                    <button 
                      onClick={() => handleDalleChange(dalleQuantity + 1)}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▲
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-1">
                  <span className="text-gray-600 text-xs text-center">פרומפטים</span>
                  <div className="flex items-center border rounded">
                    <button 
                      onClick={() => handlePromptsChange(Math.max(0, promptsQuantity - 1))}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▼
                    </button>
                    <span className="px-2 py-0.5 text-xs min-w-[30px] text-center">{promptsQuantity}</span>
                    <button 
                      onClick={() => handlePromptsChange(promptsQuantity + 1)}
                      className="px-1 py-0.5 hover:bg-gray-100 text-xs"
                      disabled={isUpdating}
                    >
                      ▲
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Total Cost */}
              <div className="pt-3 border-t">
                <div className="text-gray-600 font-medium">
                  סה"כ: ₪{(((gpt4Quantity * 2.5) + (claudeQuantity * 1.5) + (dalleQuantity * 5) + (promptsQuantity * 0.165)) * 3.6).toFixed(2)}
                </div>
              </div>

              {/* Work Timer */}
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2">
                  <select 
                    className="text-xs px-2 py-1 border rounded"
                    value={workType}
                    onChange={(e) => setWorkType(e.target.value)}
                  >
                    <option value="עיצוב">עיצוב</option>
                    <option value="עריכה">עריכה</option>
                    <option value="בדיקה">בדיקה</option>
                    <option value="תיאום">תיאום</option>
                    <option value="מחקר">מחקר</option>
                  </select>
                  <Input 
                    placeholder="תיאור עבודה" 
                    className="text-xs h-8 flex-1"
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant={isTimerRunning ? "destructive" : "default"}
                    onClick={toggleTimer}
                    className="text-xs px-2 py-1 h-8"
                  >
                    {isTimerRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {timerValue}
                  </div>
                </div>
              </div>

              {/* Work Sessions History */}
              <WorkSessionsHistory clientId={clientId} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content - Submissions */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Submissions List (Sidebar) - Real Data */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">הגשות</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {submissionsLoading ? (
              <div className="p-4 text-center text-gray-500">טוען הגשות...</div>
            ) : submissionsError ? (
              <div className="p-4 text-center text-red-500">שגיאה בטעינת הגשות</div>
            ) : submissions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">אין הגשות</div>
            ) : (
              <div className="space-y-1">
                {submissions
                  .sort((a, b) => {
                    // Status priority: active work first, completed last
                    const statusPriority = {
                      'ממתינה לעיבוד': 1,
                      'בעיבוד': 2,
                      'מוכנה להצגה': 3,
                      'הערות התקבלו': 4,
                      'הושלמה ואושרה': 5
                    };
                    
                    const priorityA = statusPriority[a.submission_status] || 6;
                    const priorityB = statusPriority[b.submission_status] || 6;
                    
                    return priorityA - priorityB;
                  })
                  .map((submission, index) => (
                  <div
                    key={submission.submission_id}
                    className={`p-3 cursor-pointer border-r-4 ${
                      selectedSubmission === index 
                        ? 'bg-blue-50 border-blue-500' 
                        : 'hover:bg-gray-50 border-transparent'
                    }`}
                    onClick={() => setSelectedSubmission(index)}
                  >
                    <div className="font-medium text-sm">{submission.item_name_at_submission}</div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="outline" className="text-xs">
                        {submission.submission_status}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {submission.original_image_urls?.length || 0} → {submission.processed_image_urls?.length || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Details - Real Data */}
        <Card className="col-span-9">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">
                  {submissions[selectedSubmission]?.item_name_at_submission || 'בחר הגשה'}
                </CardTitle>
                {submissions[selectedSubmission] && (
                  <StatusSelector
                    currentStatus={submissions[selectedSubmission].submission_status as any}
                    onStatusChange={handleStatusChange}
                    isUpdating={isStatusUpdating}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackgroundImages(!showBackgroundImages)}
                >
                  <ImageIcon className="h-4 w-4 ml-2" />
                  {showBackgroundImages ? "הסתר רקעים" : "הצג רקעים"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openComparisonView}
                  disabled={!submissions[selectedSubmission]?.original_image_urls?.length && !submissions[selectedSubmission]?.processed_image_urls?.length}
                >
                  <ImageIcon className="h-4 w-4 ml-2" />
                  השוואה מלאה
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {submissions.length > 0 && submissions[selectedSubmission] ? (
              <>
                {/* Images Section - Real Data */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Original Images */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">תמונות מקור</h3>
                      <span className="text-sm text-gray-500">
                        {submissions[selectedSubmission].original_image_urls?.length || 0} תמונות
                      </span>
                    </div>
                    
                    <div className="relative">
                      {submissions[selectedSubmission].original_image_urls && submissions[selectedSubmission].original_image_urls.length > 0 ? (
                        <>
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            <img 
                              src={submissions[selectedSubmission].original_image_urls[currentOriginalIndex]} 
                              alt="תמונה מקורית"
                              className="w-full h-full object-cover"
                              onClick={() => openLightbox(submissions[selectedSubmission].original_image_urls[currentOriginalIndex], 'original')}
                            />
                          </div>
                          
                          {/* Navigation arrows for original images */}
                          {submissions[selectedSubmission].original_image_urls.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                                onClick={() => setCurrentOriginalIndex(currentOriginalIndex === 0 ? submissions[selectedSubmission].original_image_urls.length - 1 : currentOriginalIndex - 1)}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                                onClick={() => setCurrentOriginalIndex(currentOriginalIndex === submissions[selectedSubmission].original_image_urls.length - 1 ? 0 : currentOriginalIndex + 1)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Image counter */}
                          {submissions[selectedSubmission].original_image_urls.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {currentOriginalIndex + 1} / {submissions[selectedSubmission].original_image_urls.length}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                          <span className="text-gray-500 text-sm mt-2">אין תמונות מקור</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Processed Images */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">תמונות מוכנות</h3>
                      <span className="text-sm text-gray-500">
                        {submissions[selectedSubmission].processed_image_urls?.length || 0} תמונות
                      </span>
                    </div>
                    
                    <div className="relative">
                      {submissions[selectedSubmission].processed_image_urls && submissions[selectedSubmission].processed_image_urls.length > 0 ? (
                        <>
                          <div className="aspect-square bg-green-100 rounded-lg overflow-hidden group relative cursor-pointer hover:opacity-90 transition-opacity">
                            <img 
                              src={submissions[selectedSubmission].processed_image_urls[currentProcessedIndex]} 
                              alt="תמונה מעובדת"
                              className="w-full h-full object-cover"
                              onClick={() => openLightbox(submissions[selectedSubmission].processed_image_urls[currentProcessedIndex], 'processed')}
                            />
                            
                            {/* Action buttons overlay - appears on hover */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none">
                              <div className="pointer-events-auto">
                                <AddProcessedImageModal 
                                  submissionId={submissions[selectedSubmission].submission_id}
                                  onImageAdded={handleImageAdded}
                                  isOverlay={true}
                                />
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white pointer-events-auto"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteProcessedImage(
                                    submissions[selectedSubmission].processed_image_urls[currentProcessedIndex],
                                    submissions[selectedSubmission].submission_id
                                  );
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Navigation arrows for processed images */}
                          {submissions[selectedSubmission].processed_image_urls.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-10"
                                onClick={() => setCurrentProcessedIndex(currentProcessedIndex === 0 ? submissions[selectedSubmission].processed_image_urls.length - 1 : currentProcessedIndex - 1)}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-10"
                                onClick={() => setCurrentProcessedIndex(currentProcessedIndex === submissions[selectedSubmission].processed_image_urls.length - 1 ? 0 : currentProcessedIndex + 1)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Image counter */}
                          {submissions[selectedSubmission].processed_image_urls.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded z-10">
                              {currentProcessedIndex + 1} / {submissions[selectedSubmission].processed_image_urls.length}
                            </div>
                          )}


                        </>
                      ) : (
                        <div className="aspect-square bg-green-100 rounded-lg flex items-center justify-center relative">
                          <AddProcessedImageModal 
                            submissionId={submissions[selectedSubmission].submission_id}
                            onImageAdded={handleImageAdded}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Images Toggle */}
                {showBackgroundImages && (
                  <div>
                    <h4 className="font-medium mb-3 text-gray-600">תמונות רקע להשוואה</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {backgroundImages.map((_, i) => (
                        <div key={i} className="aspect-video bg-purple-100 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-purple-600" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments System */}
                <div>
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
                      <div className="mt-4 space-y-3">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              {activeCommentTab === 'admin_internal' && 'הערה פנימית - רק צוות המערכת יוכל לראות'}
                              {activeCommentTab === 'client_visible' && 'הערה ללקוח - הלקוח יוכל לראות הערה זו'}
                              {activeCommentTab === 'editor_note' && 'הערה לעורך - רק עורכים יוכלו לראות'}
                            </span>
                          </div>
                      <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={`כתוב הערה ${activeCommentTab === 'admin_internal' ? 'פנימית' : 
                              activeCommentTab === 'client_visible' ? 'ללקוח' : 'לעורך'}...`}
                            className="min-h-[80px] bg-white border-blue-200 focus:border-blue-500"
                          />
                          <Button
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || addCommentMutation.isPending}
                            className="mt-3 w-full bg-blue-600 hover:bg-blue-700"
                          >
                            {addCommentMutation.isPending ? 'שולח...' : 'שלח הערה'}
                          </Button>
                        </div>
                      </div>
                    
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
                </div>

                {/* Client & Submission Details + LORA Details - Side by Side */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Client & Submission Details Panel */}
                  <div>
                    <h3 className="font-medium mb-3">פרטי הגשה ולקוח</h3>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      {/* Submission Details */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-blue-600">פרטי המנה</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">שם המנה:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.item_name_at_submission || 'לא זמין'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">סוג המנה:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.item_type || 'לא זמין'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">תיאור המנה:</span>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">{submissions[selectedSubmission]?.description || 'אין תיאור'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">הערות מיוחדות:</span>
                            <p className="mt-1 text-gray-600 whitespace-pre-wrap">
                              {submissions[selectedSubmission]?.ingredients?.length > 0 
                                ? submissions[selectedSubmission].ingredients.join(', ')
                                : 'אין הערות מיוחדות'
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Client Contact Details */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-green-600">פרטי התקשורת</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">שם המסעדה:</span>
                            <span className="mr-2">{client.restaurant_name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">איש קשר:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.contact_name || client.contact_name || 'לא זמין'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">אימייל:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.email || client.email || 'לא זמין'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">טלפון:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.phone || client.phone || 'לא זמין'}</span>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Submission Metadata */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 text-purple-600">מידע נוסף</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">תאריך הגשה:</span>
                            <span className="mr-2">
                              {submissions[selectedSubmission]?.uploaded_at 
                                ? new Date(submissions[selectedSubmission].uploaded_at).toLocaleDateString('he-IL')
                                : 'לא זמין'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">סטטוס נוכחי:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.submission_status || 'לא זמין'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">קטגוריה:</span>
                            <span className="mr-2">{submissions[selectedSubmission]?.category || 'לא זמין'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* LORA Details Panel */}
                  <div>
                    <h3 className="font-medium mb-3">פרטי LORA</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          placeholder="שם LORA" 
                          value={loraDetails.lora_name}
                          onChange={(e) => updateLoraField('lora_name', e.target.value)}
                          disabled={isLoraSaving}
                        />
                        <Input 
                          placeholder="מזהה LORA" 
                          value={loraDetails.lora_id}
                          onChange={(e) => updateLoraField('lora_id', e.target.value)}
                          disabled={isLoraSaving}
                        />
                        <Input 
                          placeholder="קישור LORA" 
                          className="col-span-2" 
                          value={loraDetails.lora_link}
                          onChange={(e) => updateLoraField('lora_link', e.target.value)}
                          disabled={isLoraSaving}
                        />
                        <Textarea 
                          placeholder="Prompt קבוע" 
                          className="col-span-2 min-h-[60px]" 
                          value={loraDetails.fixed_prompt}
                          onChange={(e) => updateLoraField('fixed_prompt', e.target.value)}
                          disabled={isLoraSaving}
                        />
                      </div>
                      {isLoraSaving && <div className="text-xs text-gray-500 mt-2">שומר פרטי LORA...</div>}
                    </div>
                  </div>
                </div>



                <Separator />

                {/* Action History */}
                <div>
                  <h3 className="font-medium mb-4">היסטוריית פעולות</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">הועלו תמונות מוכנות</span>
                          <span className="text-xs text-gray-500">13/06/2025 14:30</span>
                        </div>
                                                  <p className="text-xs text-gray-600">הועלו 2 תמונות מוכנות חדשות עבור חמבורגר טרופי</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">סטטוס עודכן</span>
                          <span className="text-xs text-gray-500">13/06/2025 10:15</span>
                        </div>
                        <p className="text-xs text-gray-600">סטטוס ההגשה עודכן מ"ממתין" ל"בתהליך"</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">הגשה נקלטה</span>
                          <span className="text-xs text-gray-500">13/06/2025 09:30</span>
                        </div>
                        <p className="text-xs text-gray-600">הגשה חדשה נקלטה במערכת עם 3 תמונות מקור</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">הערה נוספה</span>
                          <span className="text-xs text-gray-500">13/06/2025 11:45</span>
                        </div>
                        <p className="text-xs text-gray-600">נוספה הערה חדשה ללקוח בנוגע לסגנון הרצוי</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500 py-8">
                בחר הגשה מהרשימה כדי לראות פרטים
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage}
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          images={lightboxImages}
          currentIndex={lightboxCurrentIndex}
          onNavigate={navigateLightbox}
        />
      )}

      {/* Fullscreen Comparison */}
      <FullscreenComparison
        isOpen={isComparisonViewOpen}
        onClose={closeComparisonView}
        originalImages={submissions[selectedSubmission]?.original_image_urls || []}
        processedImages={submissions[selectedSubmission]?.processed_image_urls || []}
        originalIndex={comparisonOriginalIndex}
        processedIndex={comparisonProcessedIndex}
        onNavigateOriginal={navigateComparisonOriginal}
        onNavigateProcessed={navigateComparisonProcessed}
      />
    </div>
  );
}; 