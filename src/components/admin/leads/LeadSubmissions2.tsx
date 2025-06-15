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
import { Lead } from '@/types/lead';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useLeadSubmissions } from '@/hooks/useSubmissions';
import { useSubmissionNotes } from '@/hooks/useSubmissionNotes';
import { useLoraDetails } from '@/hooks/useLoraDetails';
import { useSubmissionStatus } from '@/hooks/useSubmissionStatus';
import { StatusSelector } from '../client-details/StatusSelector';

interface LeadSubmissions2Props {
  leadId: string;
  lead: Lead;
}

// Work Sessions History Component for Leads
const LeadWorkSessionsHistory: React.FC<{ leadId: string }> = ({ leadId }) => {
  const [workSessions, setWorkSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkSessions = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('work_sessions')
          .select('*')
          .eq('lead_id', leadId)
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
      if (event.detail.leadId === leadId) {
        fetchWorkSessions();
      }
    };

    window.addEventListener('lead-work-session-saved', handleWorkSessionSaved as EventListener);

    return () => {
      window.removeEventListener('lead-work-session-saved', handleWorkSessionSaved as EventListener);
    };
  }, [leadId]);

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

  return (
    <div className="pt-3 border-t">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs font-medium text-gray-700">פעילות עבודה אחרונה:</div>
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

// Add Image Upload Modal Component for Leads
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

// Fullscreen Comparison Component for Leads
const FullscreenComparison: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  originalImages: string[];
  processedImages: string[];
  originalIndex: number;
  processedIndex: number;
  onNavigateOriginal: (direction: 'prev' | 'next') => void;
  onNavigateProcessed: (direction: 'prev' | 'next') => void;
}> = ({ isOpen, onClose, originalImages, processedImages, originalIndex, processedIndex, onNavigateOriginal, onNavigateProcessed }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 bg-black border-none">
        <div className="relative w-full h-[98vh] flex">
          {/* Processed Images Side - Left */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-800">
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-black/50 text-white px-3 py-1 rounded text-sm font-medium">
                תמונות מעובדות
              </div>
            </div>
            
            {processedImages.length > 0 ? (
              <>
                <img 
                  src={processedImages[processedIndex]} 
                  alt="תמונה מעובדת"
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation arrows for processed images */}
                {processedImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                      onClick={() => onNavigateProcessed('prev')}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                      onClick={() => onNavigateProcessed('next')}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                {/* Image counter for processed images */}
                {processedImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded">
                    {processedIndex + 1} / {processedImages.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white/60 text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                <p>אין תמונות מעובדות</p>
              </div>
            )}
          </div>
          
          {/* Divider */}
          <div className="w-px bg-white/20"></div>
          
          {/* Original Images Side - Right */}
          <div className="flex-1 relative flex items-center justify-center bg-gray-900">
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-black/50 text-white px-3 py-1 rounded text-sm font-medium">
                תמונות מקור
              </div>
            </div>
            
            {originalImages.length > 0 ? (
              <>
                <img 
                  src={originalImages[originalIndex]} 
                  alt="תמונה מקורית"
                  className="max-w-full max-h-full object-contain"
                />
                
                {/* Navigation arrows for original images */}
                {originalImages.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                      onClick={() => onNavigateOriginal('prev')}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                      onClick={() => onNavigateOriginal('next')}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                {/* Image counter for original images */}
                {originalImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded">
                    {originalIndex + 1} / {originalImages.length}
                  </div>
                )}
              </>
            ) : (
              <div className="text-white/60 text-center">
                <ImageIcon className="h-16 w-16 mx-auto mb-4" />
                <p>אין תמונות מקור</p>
              </div>
            )}
          </div>
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/20 hover:bg-white/40 text-white z-20"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const LeadSubmissions2: React.FC<LeadSubmissions2Props> = ({
  leadId,
  lead
}) => {
  // State management
  const [selectedSubmission, setSelectedSubmission] = useState(0);
  const [showCosts, setShowCosts] = useState(false);
  const [showBackgroundImages, setShowBackgroundImages] = useState(false);
  const [activeNotesTab, setActiveNotesTab] = useState<'self' | 'client' | 'editor'>('self');
  
  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [workType, setWorkType] = useState('עיצוב');
  const [workDescription, setWorkDescription] = useState('');
  
  // Cost tracking state
  const [gpt4Quantity, setGpt4Quantity] = useState(lead.gpt4_quantity || 0);
  const [claudeQuantity, setClaudeQuantity] = useState(lead.claude_quantity || 0);
  const [dalleQuantity, setDalleQuantity] = useState(lead.dalle_quantity || 0);
  const [promptsQuantity, setPromptsQuantity] = useState(lead.prompts_quantity || 0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Image navigation state
  const [currentOriginalIndex, setCurrentOriginalIndex] = useState(0);
  const [currentProcessedIndex, setCurrentProcessedIndex] = useState(0);
  
  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<'original' | 'processed'>('original');
  
  // Comparison view state
  const [isComparisonViewOpen, setIsComparisonViewOpen] = useState(false);
  const [comparisonOriginalIndex, setComparisonOriginalIndex] = useState(0);
  const [comparisonProcessedIndex, setComparisonProcessedIndex] = useState(0);

  const queryClient = useQueryClient();
  
  // Fetch submissions for this lead
  const { data: submissions = [], isLoading: submissionsLoading, error: submissionsError, refetch: refetchSubmissions } = useLeadSubmissions(leadId);
  
  // Get current submission
  const currentSubmissionId = submissions[selectedSubmission]?.submission_id;
  
  // Hooks for current submission
  const { notes, updateNote, isSaving } = useSubmissionNotes(currentSubmissionId || '');
  const { loraDetails, updateLoraField, isSaving: isLoraUpdating } = useLoraDetails(currentSubmissionId || '');
  const { updateSubmissionStatus, isUpdating: isStatusUpdating } = useSubmissionStatus();

  // Calculate stats
  const inProgressCount = submissions.filter(s => s.submission_status === 'בעיבוד').length;
  const waitingCount = submissions.filter(s => s.submission_status === 'ממתינה לעיבוד').length;
  const completedCount = submissions.filter(s => s.submission_status === 'הושלמה ואושרה').length;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Format timer display
  const timerValue = `${Math.floor(timerSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0')}:${(timerSeconds % 60).toString().padStart(2, '0')}`;

  // Update lead cost field
  const updateLeadCostField = async (field: string, value: number) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('leads')
        .update({ [field]: value })
        .eq('lead_id', leadId);

      if (error) throw error;

      // Update local state
      switch (field) {
        case 'gpt4_quantity':
          setGpt4Quantity(value);
          break;
        case 'claude_quantity':
          setClaudeQuantity(value);
          break;
        case 'dalle_quantity':
          setDalleQuantity(value);
          break;
        case 'prompts_quantity':
          setPromptsQuantity(value);
          break;
      }

      toast.success('עלויות עודכנו בהצלחה');
    } catch (error) {
      console.error('Error updating lead costs:', error);
      toast.error('שגיאה בעדכון עלויות');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cost handlers
  const handleGpt4Change = async (newValue: number) => {
    await updateLeadCostField('gpt4_quantity', newValue);
  };

  const handleClaudeChange = async (newValue: number) => {
    await updateLeadCostField('claude_quantity', newValue);
  };

  const handleDalleChange = async (newValue: number) => {
    await updateLeadCostField('dalle_quantity', newValue);
  };

  const handlePromptsChange = async (newValue: number) => {
    await updateLeadCostField('prompts_quantity', newValue);
  };

  // Timer functions
  const toggleTimer = async () => {
    if (isTimerRunning) {
      // Stop timer and save session
      const durationMinutes = Math.max(1, Math.ceil(timerSeconds / 60));
      await saveWorkSession(durationMinutes);
      setIsTimerRunning(false);
      setTimerSeconds(0);
    } else {
      // Start timer
      setIsTimerRunning(true);
      setTimerSeconds(0);
    }
  };

  const saveWorkSession = async (durationMinutes: number) => {
    try {
      const sessionData = {
        lead_id: leadId,
        duration_minutes: durationMinutes,
        session_date: new Date().toISOString().split('T')[0],
        work_type: workType,
        description: workDescription || null,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('work_sessions').insert(sessionData);
      
      if (!error) {
        const timeDisplay = durationMinutes >= 60 
          ? `${Math.floor(durationMinutes / 60)}:${(durationMinutes % 60).toString().padStart(2, '0')} שעות`
          : `${durationMinutes} דקות`;
        
        toast.success(`נשמר זמן עבודה: ${workType} - ${timeDisplay}`);
        
        // Trigger refresh event
        window.dispatchEvent(new CustomEvent('lead-work-session-saved', {
          detail: { leadId }
        }));
      }
    } catch (error) {
      console.error('Error saving work session:', error);
      toast.error('שגיאה בשמירת זמן עבודה');
    }
  };

  // Status change handler
  const handleStatusChange = async (newStatus: any) => {
    if (!currentSubmissionId) return;
    
    const success = await updateSubmissionStatus(currentSubmissionId, newStatus);
    if (success) {
      refetchSubmissions();
    }
  };

  // Lightbox functions
  const openLightbox = (imageUrl: string, type: 'original' | 'processed' = 'original') => {
    const currentSubmission = submissions[selectedSubmission];
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
    setLightboxCurrentIndex(currentIndex);
    setLightboxType(type);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    setLightboxImage('');
    setLightboxImages([]);
    setLightboxCurrentIndex(0);
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const images = lightboxType === 'original' 
      ? submissions[selectedSubmission]?.original_image_urls || []
      : submissions[selectedSubmission]?.processed_image_urls || [];
    
    if (images.length <= 1) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = lightboxCurrentIndex === 0 ? images.length - 1 : lightboxCurrentIndex - 1;
    } else {
      newIndex = lightboxCurrentIndex === images.length - 1 ? 0 : lightboxCurrentIndex + 1;
    }
    
    setLightboxCurrentIndex(newIndex);
    setLightboxImage(images[newIndex]);
  };

  const handleImageAdded = () => {
    // Refresh submissions data after image is added
    refetchSubmissions();
  };

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Header Stats (3 squares) */}
      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{inProgressCount}</div>
            <div className="text-sm text-gray-600">בביצוע</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{waitingCount}</div>
            <div className="text-sm text-gray-600">ממתינות</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-gray-600">הושלמו</div>
          </CardContent>
        </Card>
      </div>

      {/* Costs Section */}
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
              {/* AI Training Costs */}
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
              <LeadWorkSessionsHistory leadId={leadId} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Content - Submissions */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Submissions List (Sidebar) */}
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
                {submissions.map((submission, index) => (
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

        {/* Submission Details */}
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
                  onClick={() => setIsComparisonViewOpen(true)}
                >
                  השוואה מלאה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackgroundImages(!showBackgroundImages)}
                >
                  <ImageIcon className="h-4 w-4 ml-2" />
                  {showBackgroundImages ? "הסתר רקעים" : "הצג רקעים"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {submissions.length > 0 && submissions[selectedSubmission] ? (
              <>
                {/* Images Section */}
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
                      <h3 className="font-medium">תמונות מעובדות</h3>
                      <span className="text-sm text-gray-500">
                        {submissions[selectedSubmission].processed_image_urls?.length || 0} תמונות
                      </span>
                    </div>
                    
                    <div className="relative">
                      {submissions[selectedSubmission].processed_image_urls && submissions[selectedSubmission].processed_image_urls.length > 0 ? (
                        <>
                          <div className="aspect-square bg-green-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity group">
                            <img 
                              src={submissions[selectedSubmission].processed_image_urls[currentProcessedIndex]} 
                              alt="תמונה מעובדת"
                              className="w-full h-full object-cover"
                              onClick={() => openLightbox(submissions[selectedSubmission].processed_image_urls[currentProcessedIndex], 'processed')}
                            />
                            
                            {/* Action buttons overlay */}
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 pointer-events-none">
                              <div className="pointer-events-auto">
                                <AddProcessedImageModal 
                                  submissionId={submissions[selectedSubmission].submission_id}
                                  onImageAdded={handleImageAdded}
                                  isOverlay={true}
                                />
                              </div>
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

                {/* LORA Details Section */}
                <div className="space-y-4">
                  <h4 className="font-medium">פרטי LORA</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-600">שם LORA</label>
                      <Input 
                        placeholder="שם LORA" 
                        value={loraDetails.lora_name}
                        onChange={(e) => updateLoraField('lora_name', e.target.value)}
                        disabled={isLoraUpdating}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">מזהה LORA</label>
                      <Input 
                        placeholder="מזהה LORA" 
                        value={loraDetails.lora_id}
                        onChange={(e) => updateLoraField('lora_id', e.target.value)}
                        disabled={isLoraUpdating}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">קישור LORA</label>
                      <Input 
                        placeholder="קישור LORA" 
                        value={loraDetails.lora_link}
                        onChange={(e) => updateLoraField('lora_link', e.target.value)}
                        disabled={isLoraUpdating}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">פרומפט קבוע</label>
                      <Input 
                        placeholder="פרומפט קבוע" 
                        value={loraDetails.fixed_prompt}
                        onChange={(e) => updateLoraField('fixed_prompt', e.target.value)}
                        disabled={isLoraUpdating}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  {isLoraUpdating && <div className="text-xs text-gray-500">שומר פרטי LORA...</div>}
                </div>

                {/* Notes Section - Tabbed */}
                <div>
                  <Tabs value={activeNotesTab} onValueChange={setActiveNotesTab} className="w-full">
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="self">הערה לעצמי</TabsTrigger>
                      <TabsTrigger value="client">הערה ללקוח</TabsTrigger>
                      <TabsTrigger value="editor">הערה לעורך</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="self" className="mt-4">
                      <Textarea
                        placeholder="הערות אישיות להגשה..."
                        value={notes.admin_internal}
                        onChange={(e) => updateNote('admin_internal', e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSaving}
                      />
                      {isSaving && <div className="text-xs text-gray-500 mt-1">שומר...</div>}
                    </TabsContent>
                    
                    <TabsContent value="client" className="mt-4">
                      <Textarea
                        placeholder="הערות ללקוח..."
                        value={notes.client_visible}
                        onChange={(e) => updateNote('client_visible', e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSaving}
                      />
                      {isSaving && <div className="text-xs text-gray-500 mt-1">שומר...</div>}
                    </TabsContent>
                    
                    <TabsContent value="editor" className="mt-4">
                      <Textarea
                        placeholder="הערות לעורך..."
                        value={notes.editor_note}
                        onChange={(e) => updateNote('editor_note', e.target.value)}
                        className="min-h-[80px] resize-none"
                        disabled={isSaving}
                      />
                      {isSaving && <div className="text-xs text-gray-500 mt-1">שומר...</div>}
                    </TabsContent>
                  </Tabs>
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

      {/* Lightbox Dialog */}
      {isLightboxOpen && (
        <FullscreenComparison
          isOpen={isLightboxOpen}
          onClose={closeLightbox}
          originalImages={submissions[selectedSubmission]?.original_image_urls || []}
          processedImages={submissions[selectedSubmission]?.processed_image_urls || []}
          originalIndex={currentOriginalIndex}
          processedIndex={currentProcessedIndex}
          onNavigateOriginal={(direction) => setCurrentOriginalIndex(direction === 'prev' ? currentOriginalIndex === 0 ? submissions[selectedSubmission].original_image_urls.length - 1 : currentOriginalIndex - 1 : currentOriginalIndex === submissions[selectedSubmission].original_image_urls.length - 1 ? 0 : currentOriginalIndex + 1)}
          onNavigateProcessed={(direction) => setCurrentProcessedIndex(direction === 'prev' ? currentProcessedIndex === 0 ? submissions[selectedSubmission].processed_image_urls.length - 1 : currentProcessedIndex - 1 : currentProcessedIndex === submissions[selectedSubmission].processed_image_urls.length - 1 ? 0 : currentProcessedIndex + 1)}
        />
      )}

      {/* Fullscreen Comparison Dialog */}
      <FullscreenComparison
        isOpen={isComparisonViewOpen}
        onClose={() => setIsComparisonViewOpen(false)}
        originalImages={submissions[selectedSubmission]?.original_image_urls || []}
        processedImages={submissions[selectedSubmission]?.processed_image_urls || []}
        originalIndex={comparisonOriginalIndex}
        processedIndex={comparisonProcessedIndex}
        onNavigateOriginal={(direction) => {
          const currentSubmission = submissions[selectedSubmission];
          if (!currentSubmission?.original_image_urls) return;
          
          let newIndex: number;
          if (direction === 'prev') {
            newIndex = comparisonOriginalIndex === 0 ? currentSubmission.original_image_urls.length - 1 : comparisonOriginalIndex - 1;
          } else {
            newIndex = comparisonOriginalIndex === currentSubmission.original_image_urls.length - 1 ? 0 : comparisonOriginalIndex + 1;
          }
          setComparisonOriginalIndex(newIndex);
        }}
        onNavigateProcessed={(direction) => {
          const currentSubmission = submissions[selectedSubmission];
          if (!currentSubmission?.processed_image_urls) return;
          
          let newIndex: number;
          if (direction === 'prev') {
            newIndex = comparisonProcessedIndex === 0 ? currentSubmission.processed_image_urls.length - 1 : comparisonProcessedIndex - 1;
          } else {
            newIndex = comparisonProcessedIndex === currentSubmission.processed_image_urls.length - 1 ? 0 : comparisonProcessedIndex + 1;
          }
          setComparisonProcessedIndex(newIndex);
        }}
      />
    </div>
  );
}; 