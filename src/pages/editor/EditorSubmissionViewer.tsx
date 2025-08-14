import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Maximize2, 
  Download,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { ImageComments } from '@/components/customer/ImageComments';

interface Submission {
  submission_id: string;
  item_name_at_submission: string;
  submission_status: string;
  uploaded_at: string;
  original_image_urls: string[];
  processed_image_urls: string[];
}

interface Comment {
  id: string;
  comment_text: string;
  comment_type: 'admin_internal' | 'client_visible' | 'editor_note';
  created_at: string;
}

const SUBMISSION_STATUSES = {
  'ממתינה לעיבוד': { label: 'Pending Processing', color: 'bg-yellow-100 text-yellow-800' },
  'בעיבוד': { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
  'מוכנה להצגה': { label: 'Ready for Review', color: 'bg-green-100 text-green-800' },
  'הערות התקבלו': { label: 'Feedback Received', color: 'bg-orange-100 text-orange-800' },
  'הושלמה ואושרה': { label: 'Completed & Approved', color: 'bg-gray-100 text-gray-800' }
};

const EditorSubmissionViewer: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [selectedOriginalIndex, setSelectedOriginalIndex] = useState(0);
  const [selectedProcessedIndex, setSelectedProcessedIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string>('');
  const [fullscreenImages, setFullscreenImages] = useState<string[]>([]);
  const [fullscreenIndex, setFullscreenIndex] = useState(0);
  const [newNote, setNewNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Fetch submission data
  const { data: submission, isLoading, error } = useQuery<Submission>({
    queryKey: ['editor-submission', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          original_image_urls,
          processed_image_urls
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: Submission = {
        submission_id: data.submission_id,
        item_name_at_submission: data.item_name_at_submission,
        submission_status: data.submission_status,
        uploaded_at: data.uploaded_at,
        original_image_urls: data.original_image_urls || [],
        processed_image_urls: data.processed_image_urls || [],
      };
      
      return transformedData;
    }
  });

  // Fetch comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['submission-comments', submissionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('submission_comments')
        .select('*')
        .eq('submission_id', submissionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase
        .from('customer_submissions')
        .update({ submission_status: newStatus })
        .eq('submission_id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-submission', submissionId] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (commentText: string) => {
      const { error } = await supabase
        .from('submission_comments')
        .insert({
          submission_id: submissionId,
          comment_text: commentText,
          comment_type: 'editor_note',
          visibility: 'admin'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-comments', submissionId] });
      setNewNote('');
      toast.success('Note added successfully');
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });

  // Upload processed image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      setIsUploading(true);
      
      // Upload to Supabase Storage
      const fileName = `processed_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('food-vision-images')
        .upload(`submissions/${submissionId}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(uploadData.path);

      // Update submission with new processed image
      const currentImages = submission?.processed_image_urls || [];
      const updatedImages = [...currentImages, publicUrl];

      const { error: updateError } = await supabase
        .from('customer_submissions')
        .update({ processed_image_urls: updatedImages })
        .eq('submission_id', submissionId);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-submission', submissionId] });
      toast.success('Image uploaded successfully');
      setIsUploading(false);
    },
    onError: () => {
      toast.error('Failed to upload image');
      setIsUploading(false);
    }
  });

  // Delete processed image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const currentImages = submission?.processed_image_urls || [];
      const updatedImages = currentImages.filter(url => url !== imageUrl);

      const { error } = await supabase
        .from('customer_submissions')
        .update({ processed_image_urls: updatedImages })
        .eq('submission_id', submissionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editor-submission', submissionId] });
      toast.success('Image deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete image');
    }
  });

  // Event handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const handleDeleteImage = (imageUrl: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate(imageUrl);
    }
  };

  const openFullscreen = (imageUrl: string, images: string[], index: number) => {
    setFullscreenImage(imageUrl);
    setFullscreenImages(images);
    setFullscreenIndex(index);
    setIsFullscreenOpen(true);
  };

  const navigateFullscreen = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' 
      ? (fullscreenIndex === 0 ? fullscreenImages.length - 1 : fullscreenIndex - 1)
      : (fullscreenIndex === fullscreenImages.length - 1 ? 0 : fullscreenIndex + 1);
    
    setFullscreenIndex(newIndex);
    setFullscreenImage(fullscreenImages[newIndex]);
  };

  const navigateOriginal = (direction: 'prev' | 'next') => {
    const images = submission?.original_image_urls || [];
    const newIndex = direction === 'prev'
      ? (selectedOriginalIndex === 0 ? images.length - 1 : selectedOriginalIndex - 1)
      : (selectedOriginalIndex === images.length - 1 ? 0 : selectedOriginalIndex + 1);
    setSelectedOriginalIndex(newIndex);
  };

  const navigateProcessed = (direction: 'prev' | 'next') => {
    const images = submission?.processed_image_urls || [];
    const newIndex = direction === 'prev'
      ? (selectedProcessedIndex === 0 ? images.length - 1 : selectedProcessedIndex - 1)
      : (selectedProcessedIndex === images.length - 1 ? 0 : selectedProcessedIndex + 1);
    setSelectedProcessedIndex(newIndex);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading submission...</div>;
  }

  if (error || !submission) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          Failed to load submission details
        </AlertDescription>
      </Alert>
    );
  }

  const statusInfo = SUBMISSION_STATUSES[submission.submission_status as keyof typeof SUBMISSION_STATUSES] || {
    label: submission.submission_status,
    color: 'bg-gray-100 text-gray-800'
  };

  const originalImages = submission.original_image_urls || [];
  const processedImages = submission.processed_image_urls || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/editor')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">{submission.item_name_at_submission}</h1>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Select
                value={submission.submission_status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Images Side by Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Images Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Original Images */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Original Images</h3>
                    {originalImages.length > 0 ? (
                      <>
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={originalImages[selectedOriginalIndex]}
                            alt="Original"
                            className="w-full h-64 object-cover rounded-lg cursor-pointer"
                            onClick={() => openFullscreen(
                              originalImages[selectedOriginalIndex], 
                              originalImages, 
                              selectedOriginalIndex
                            )}
                          />
                          {originalImages.length > 1 && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => navigateOriginal('prev')}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => navigateOriginal('next')}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {originalImages.length > 1 && (
                          <div className="text-center text-sm text-gray-500">
                            {selectedOriginalIndex + 1} / {originalImages.length}
                          </div>
                        )}
                      </div>
                      {/* Image-specific comments for current original image */}
                      <div className="mt-4">
                        <ImageComments
                          submissionId={submission.submission_id}
                          imageUrl={originalImages[selectedOriginalIndex]}
                          imageType="original"
                          viewMode="editor"
                        />
                      </div>
                      </>
                    ) : (
                      <div className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No original images</span>
                      </div>
                    )}
                  </div>

                  {/* Processed Images */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Processed Images</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </div>
                    
                    {processedImages.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative group">
                          <img
                            src={processedImages[selectedProcessedIndex]}
                            alt="Processed"
                            className="w-full h-64 object-cover rounded-lg cursor-pointer"
                            onClick={() => openFullscreen(
                              processedImages[selectedProcessedIndex], 
                              processedImages, 
                              selectedProcessedIndex
                            )}
                          />
                          
                          {/* Action buttons overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => window.open(processedImages[selectedProcessedIndex], '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteImage(processedImages[selectedProcessedIndex])}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openFullscreen(
                                processedImages[selectedProcessedIndex], 
                                processedImages, 
                                selectedProcessedIndex
                              )}
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {processedImages.length > 1 && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute left-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => navigateProcessed('prev')}
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => navigateProcessed('next')}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {processedImages.length > 1 && (
                          <div className="text-center text-sm text-gray-500">
                            {selectedProcessedIndex + 1} / {processedImages.length}
                          </div>
                        )}
                        {/* Image-specific comments for current processed image */}
                        <div className="mt-4">
                          <ImageComments
                            submissionId={submission.submission_id}
                            imageUrl={processedImages[selectedProcessedIndex]}
                            imageType="processed"
                            viewMode="editor"
                          />
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-gray-500">Upload processed image</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Notes and Details */}
          <div className="space-y-6">
            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Restaurant</p>
                  <p className="font-medium">Restaurant Info</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Uploaded:</span>
                  <p className="font-medium">{new Date(submission.uploaded_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Editor Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Add your notes here..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={4}
                  />
                  <Button
                    className="mt-2 w-full"
                    onClick={() => addCommentMutation.mutate(newNote)}
                    disabled={!newNote.trim() || addCommentMutation.isPending}
                  >
                    Add Note
                  </Button>
                </div>

                {/* Existing Notes */}
                <div className="space-y-3">
                  {comments
                    .filter(comment => comment.comment_type === 'editor_note')
                    .map((comment) => (
                      <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{comment.comment_text}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative w-full h-[90vh] bg-black flex items-center justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setIsFullscreenOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <img
              src={fullscreenImage}
              alt="Fullscreen view"
              className="max-w-full max-h-full object-contain"
            />
            
            {fullscreenImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigateFullscreen('prev')}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={() => navigateFullscreen('next')}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded">
                  {fullscreenIndex + 1} / {fullscreenImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditorSubmissionViewer; 