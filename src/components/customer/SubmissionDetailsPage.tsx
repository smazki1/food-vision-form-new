import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useMessages } from "@/hooks/useMessages";
import { useAddSubmissionComment } from "@/hooks/useSubmissions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, Download, Edit, MessageSquare, Send, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShareDialog } from "./ShareDialog";

// Status badge variant mapping
const statusBadgeVariant: Record<string, string> = {
  "ממתינה לעיבוד": "yellow",
  "בעיבוד": "blue",
  "מוכנה להצגה": "purple",
  "הערות התקבלו": "warning",
  "הושלמה ואושרה": "green"
};

export function SubmissionDetailsPage() {
  const { submissionId, clientId } = useParams<{ submissionId: string; clientId?: string }>();
  const { submission, loading: submissionLoading, error: submissionError, updateSubmissionStatus, setMainProcessedImage } = useSubmission(submissionId);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(submissionId);
  const addCommentMutation = useAddSubmissionComment();
  
  const [editNote, setEditNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Navigation state for images
  const [currentProcessedIndex, setCurrentProcessedIndex] = useState(0);
  const [currentOriginalIndex, setCurrentOriginalIndex] = useState(0);
  
  // Lightbox navigation state
  const [lightboxImageType, setLightboxImageType] = useState<'processed' | 'original' | null>(null);
  const [lightboxCurrentIndex, setLightboxCurrentIndex] = useState(0);
  
  // Fullscreen comparison state
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [comparisonProcessedIndex, setComparisonProcessedIndex] = useState(0);
  const [comparisonOriginalIndex, setComparisonOriginalIndex] = useState(0);
  const [comparisonImageType, setComparisonImageType] = useState<'processed' | 'original'>('processed');

  // Prevent body scroll when dialogs are open
  useEffect(() => {
    if (selectedImage || isComparisonOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, isComparisonOpen]);

  const handleRequestEdit = async () => {
    if (!editNote.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין הערות לעריכה",
        variant: "destructive",
      });
      return;
    }
    
    if (!submission?.submission_id) {
      toast({
        title: "שגיאה",
        description: "לא נמצא מזהה הגשה",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the new submission_comments system
      await addCommentMutation.mutateAsync({
        submissionId: submission.submission_id,
        commentType: 'client_visible',
        commentText: editNote,
        visibility: 'admin'
      });

      // Update submission status to indicate client feedback received
      const statusSuccess = await updateSubmissionStatus("הערות התקבלו");
      
      if (statusSuccess) {
        toast({
          title: "בקשת עריכה נשלחה",
          description: "בקשת העריכה שלכם התקבלה ותטופל בקרוב",
        });
        setEditNote("");
        setEditDialogOpen(false);
      } else {
        toast({
          title: "שגיאה בעדכון סטטוס",
          description: "ההערה נשמרה אך הסטטוס לא עודכן",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in handleRequestEdit:", error);
      toast({
        title: "שגיאה בשליחת בקשת העריכה",
        description: "אירעה שגיאה בעת שליחת בקשת העריכה. אנא נסו שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    const success = await updateSubmissionStatus("הושלמה ואושרה");
    
    if (success) {
      toast({
        title: "המנה אושרה",
        description: "המנה סומנה כמאושרת ומוכנה להורדה",
      });
    } else {
      toast({
        title: "שגיאה באישור המנה",
        description: "אירעה שגיאה בעת אישור המנה. אנא נסו שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    const sent = await sendMessage(newMessage);
    
    if (sent) {
      setNewMessage("");
      toast({
        title: "ההודעה נשלחה",
        description: "ההודעה שלכם נשלחה לצוות העריכה",
      });
    } else {
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "אירעה שגיאה בעת שליחת ההודעה. אנא נסו שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };
  
  const handleSetMainImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    const success = await setMainProcessedImage(imageUrl);
    
    if (success) {
      toast({
        title: "תמונה ראשית הוגדרה",
        description: "התמונה הראשית עודכנה בהצלחה",
      });
    } else {
      toast({
        title: "שגיאה בעדכון התמונה הראשית",
        description: "אירעה שגיאה בעת עדכון התמונה הראשית. אנא נסו שוב מאוחר יותר.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadImage = (imageUrl: string) => {
    // Create a temporary anchor element to download the image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${submission?.item_name_at_submission || 'food-vision-image'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "הורדת תמונה",
      description: "התמונה מורדת למחשב שלכם",
    });
  };

  const handleShareImage = (imageUrl: string) => {
    setImageToShare(imageUrl);
    setShareDialogOpen(true);
  };

  // Navigation functions for processed images
  const navigateProcessedImage = (direction: 'prev' | 'next') => {
    if (!submission.processed_image_urls || submission.processed_image_urls.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentProcessedIndex(prev => 
        prev === 0 ? submission.processed_image_urls!.length - 1 : prev - 1
      );
    } else {
      setCurrentProcessedIndex(prev => 
        prev === submission.processed_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Navigation functions for original images
  const navigateOriginalImage = (direction: 'prev' | 'next') => {
    if (!submission.original_image_urls || submission.original_image_urls.length === 0) return;
    
    if (direction === 'prev') {
      setCurrentOriginalIndex(prev => 
        prev === 0 ? submission.original_image_urls!.length - 1 : prev - 1
      );
    } else {
      setCurrentOriginalIndex(prev => 
        prev === submission.original_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  // Lightbox navigation functions
  const navigateLightboxImage = (direction: 'prev' | 'next') => {
    if (!lightboxImageType) return;
    
    const imageUrls = lightboxImageType === 'processed' 
      ? submission.processed_image_urls 
      : submission.original_image_urls;
    
    if (!imageUrls || imageUrls.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = lightboxCurrentIndex === 0 ? imageUrls.length - 1 : lightboxCurrentIndex - 1;
    } else {
      newIndex = lightboxCurrentIndex === imageUrls.length - 1 ? 0 : lightboxCurrentIndex + 1;
    }
    
    setLightboxCurrentIndex(newIndex);
    setSelectedImage(imageUrls[newIndex]);
  };

  // Open lightbox with navigation context
  const openLightbox = (imageUrl: string, imageType: 'processed' | 'original', index: number) => {
    setSelectedImage(imageUrl);
    setLightboxImageType(imageType);
    setLightboxCurrentIndex(index);
  };

  // Close lightbox and reset navigation state
  const closeLightbox = () => {
    setSelectedImage(null);
    setLightboxImageType(null);
    setLightboxCurrentIndex(0);
  };

  // Fullscreen comparison navigation functions
  const navigateComparisonProcessed = (direction: 'prev' | 'next') => {
    if (!submission.processed_image_urls || submission.processed_image_urls.length === 0) return;
    
    if (direction === 'prev') {
      setComparisonProcessedIndex(prev => 
        prev === 0 ? submission.processed_image_urls!.length - 1 : prev - 1
      );
    } else {
      setComparisonProcessedIndex(prev => 
        prev === submission.processed_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const navigateComparisonOriginal = (direction: 'prev' | 'next') => {
    if (!submission.original_image_urls || submission.original_image_urls.length === 0) return;
    
    if (direction === 'prev') {
      setComparisonOriginalIndex(prev => 
        prev === 0 ? submission.original_image_urls!.length - 1 : prev - 1
      );
    } else {
      setComparisonOriginalIndex(prev => 
        prev === submission.original_image_urls!.length - 1 ? 0 : prev + 1
      );
    }
  };

  const openFullscreenComparison = () => {
    setComparisonProcessedIndex(currentProcessedIndex);
    setComparisonOriginalIndex(currentOriginalIndex);
    setComparisonImageType('processed'); // Start with processed image
    setIsComparisonOpen(true);
  };

  if (submissionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (submissionError || !submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>שגיאה בטעינת פרטי הגשה</CardTitle>
          <CardDescription>
            אירעה שגיאה בעת טעינת פרטי ההגשה. אנא נסו שוב מאוחר יותר.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild>
            <Link to="/customer/submissions">
              <ArrowLeft className="ml-2 h-4 w-4" />
              חזרה לרשימת ההגשות
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Check if this submission has processed images
  const hasProcessedImages = submission.processed_image_urls && submission.processed_image_urls.length > 0;
  
  // Check if this submission can be edited or approved
  const canRequestEdit = ["מוכנה להצגה", "הערות התקבלו"].includes(submission.submission_status);
  const canApprove = submission.submission_status === "מוכנה להצגה";
  
  // Check if images can be downloaded or shared
  const canDownload = submission.submission_status === "הושלמה ואושרה";
  const canShare = submission.submission_status === "הושלמה ואושרה";
  
  // Parse the edit history if available
  const editHistory = submission.edit_history?.status_changes || [];

  const getBackUrl = () => {
    if (clientId) {
      return `/customer-review/${clientId}`;
    }
    return "/customer/submissions";
  };

  const getBackText = () => {
    if (clientId) {
      return "חזרה לגלריה";
    }
    return "חזרה לרשימת ההגשות";
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6">
      {/* Back button and header - Mobile optimized */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-3 sm:space-y-2">
          <Button variant="outline" size="sm" asChild className="w-fit shadow-sm">
            <Link to={getBackUrl()}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              {getBackText()}
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">{submission.item_name_at_submission}</h1>
          <div className="flex flex-col items-center sm:items-start gap-2">
            <span className="text-sm text-muted-foreground">הועלה בתאריך: {formatDate(submission.uploaded_at)}</span>
            <Badge variant={statusBadgeVariant[submission.submission_status] as any} className="w-fit">
              {submission.submission_status}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
          {canRequestEdit && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm">
                  <Edit className="ml-2 h-4 w-4" />
                  בקש עריכה
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>בקשת עריכה</DialogTitle>
                  <DialogDescription>
                    תארו את השינויים שתרצו לראות בתמונה המעובדת
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="תארו את העריכות הנדרשות..."
                    className="h-40"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="secondary" onClick={() => setEditDialogOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleRequestEdit}>
                    שליחת בקשה
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {canApprove && (
            <Button onClick={handleApprove} className="w-full sm:w-auto py-3 sm:py-2 text-base sm:text-sm">
              <Check className="ml-2 h-4 w-4" />
              אשר מנה
            </Button>
          )}
        </div>
      </div>
      
      {/* Lightbox Dialog for selectedImage */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Selected Preview" 
              className="max-w-full max-h-full object-contain" 
            />
            
            {/* Close button */}
            <button
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              onClick={closeLightbox}
            >
              <span className="text-lg font-bold">✕</span>
            </button>
            
            {/* Navigation arrows */}
            {lightboxImageType && (() => {
              const imageUrls = lightboxImageType === 'processed' 
                ? submission.processed_image_urls 
                : submission.original_image_urls;
              
              return imageUrls && imageUrls.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                    onClick={() => navigateLightboxImage('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                    onClick={() => navigateLightboxImage('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {lightboxCurrentIndex + 1} / {imageUrls.length}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Fullscreen Comparison Dialog - Single Image View with Navigation */}
      {isComparisonOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            {comparisonImageType === 'processed' ? (
              hasProcessedImages && (
                <img 
                  src={submission.processed_image_urls[comparisonProcessedIndex]} 
                  alt="Processed" 
                  className="max-w-full max-h-full object-contain"
                />
              )
            ) : (
              submission.original_image_urls && submission.original_image_urls.length > 0 && (
                <img 
                  src={submission.original_image_urls[comparisonOriginalIndex]} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain"
                />
              )
            )}
            
            {/* Navigation arrows to switch between original and processed */}
            <button
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              onClick={() => {
                if (comparisonImageType === 'processed') {
                  setComparisonImageType('original');
                } else {
                  setComparisonImageType('processed');
                }
              }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <button
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
              onClick={() => {
                if (comparisonImageType === 'processed') {
                  setComparisonImageType('original');
                } else {
                  setComparisonImageType('processed');
                }
              }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Image type indicator */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-lg font-semibold">
              {comparisonImageType === 'processed' ? 'תמונה מעובדת' : 'תמונה מקורית'}
            </div>
            
            {/* Image counter */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm font-medium">
              {comparisonImageType === 'processed' ? (
                `${comparisonProcessedIndex + 1} / ${submission.processed_image_urls?.length || 0}`
              ) : (
                `${comparisonOriginalIndex + 1} / ${submission.original_image_urls?.length || 0}`
              )}
            </div>
            
            {/* Close button */}
            <button
              className="absolute top-4 right-4 bg-white/90 hover:bg-white text-black rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              onClick={() => setIsComparisonOpen(false)}
            >
              <span className="text-lg font-bold">✕</span>
            </button>
          </div>
        </div>
      )}

      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mb-4">
                          <TabsTrigger value="main">תמונות מוכנות</TabsTrigger>
          <TabsTrigger value="editHistory">היסטוריית עריכות</TabsTrigger>
        </TabsList>
        
        {/* Main Tab - Side by side comparison with single images */}
        <TabsContent value="main">
          <div className="space-y-4 sm:space-y-6">
            {/* Side by side image comparison - single images with navigation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full max-w-none">
              {/* Processed Images - Left Side */}
          <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-right text-lg sm:text-xl">תמונות מוכנות</CardTitle>
                    {hasProcessedImages && (
                      <Badge variant="outline" className="w-fit text-sm">
                        {currentProcessedIndex + 1} / {submission.processed_image_urls.length}
                      </Badge>
                    )}
                  </div>
            </CardHeader>
                <CardContent className="p-3 sm:p-6">
              {hasProcessedImages ? (
                                          <div className="relative group">
                        <div className="aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                          <img
                            src={submission.processed_image_urls[currentProcessedIndex]}
                            alt={`${submission.item_name_at_submission} - מעובד`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => openLightbox(submission.processed_image_urls![currentProcessedIndex], 'processed', currentProcessedIndex)}
                          />
                        </div>
                        
                        {/* Navigation arrows for processed images - Mobile optimized */}
                        {submission.processed_image_urls.length > 1 && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
                              onClick={() => navigateProcessedImage('prev')}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
                              onClick={() => navigateProcessedImage('next')}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      

                    </div>
                  ) : (
                    <div className="aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">אין תמונות מוכנות</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Original Images - Right Side */}
              <Card>
                <CardHeader className="pb-3 sm:pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-right text-lg sm:text-xl">תמונות מקור</CardTitle>
                    {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                      <Badge variant="outline" className="w-fit text-sm">
                        {currentOriginalIndex + 1} / {submission.original_image_urls.length}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-6">
                  {submission.original_image_urls && submission.original_image_urls.length > 0 ? (
                    <div className="relative group">
                      <div className="aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        <img
                          src={submission.original_image_urls[currentOriginalIndex]}
                          alt={`${submission.item_name_at_submission} - מקור`}
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => openLightbox(submission.original_image_urls![currentOriginalIndex], 'original', currentOriginalIndex)}
                        />
                      </div>
                      
                      {/* Navigation arrows for original images */}
                      {submission.original_image_urls.length > 1 && (
                        <>
                        <Button 
                          variant="secondary" 
                            size="sm"
                            className="absolute left-1 sm:left-2 top-1/2 transform -translate-y-1/2 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
                            onClick={() => navigateOriginalImage('prev')}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-black rounded-full w-8 h-8 sm:w-auto sm:h-auto p-1 sm:p-2"
                            onClick={() => navigateOriginalImage('next')}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                        )}
                      

                      </div>
                  ) : (
                    <div className="aspect-[4/3] sm:aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">אין תמונות מקור</p>
                    </div>
                  )}
                </CardContent>
              </Card>
                                  </div>
                                
            {/* Fullscreen Comparison Button */}
            {hasProcessedImages && submission.original_image_urls && submission.original_image_urls.length > 0 && (
              <div className="flex justify-center px-4 sm:px-0">
                                    <Button 
                  onClick={openFullscreenComparison}
                                        variant="outline" 
                  size="lg"
                  className="gap-2 w-full sm:w-auto text-base sm:text-sm py-3 sm:py-2"
                                      >
                  <Maximize className="h-5 w-5" />
                  השוואה מלאה
                                      </Button>
              </div>
                                    )}
                                    
            {/* Comments Section */}
            <Card>
              <CardHeader className="pb-3 sm:pb-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <MessageSquare className="h-5 w-5" />
                  הודעות והערות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-3 sm:p-6">
                {/* Existing Messages */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {messagesLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                                  </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div key={message.message_id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm">{message.sender_type}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.timestamp)}
                          </span>
                                </div>
                        <p className="text-sm">{message.content}</p>
                              </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">אין הודעות עדיין</p>
                  )}
                </div>

                {/* New Message Input */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <Textarea
                    placeholder="כתבו הודעה או הערה..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 min-h-[80px]"
                  />
                        <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="self-start sm:self-end w-full sm:w-auto py-3 sm:py-2"
                        >
                    <Send className="h-4 w-4 ml-2 sm:ml-0" />
                    <span className="sm:hidden">שלח הודעה</span>
                        </Button>
                      </div>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
        
        {/* Edit History Tab */}
        <TabsContent value="editHistory">
          <Card>
            <CardHeader>
              <CardTitle>היסטוריית עריכות</CardTitle>
              <CardDescription>
                רשימת בקשות העריכה והשינויים שבוצעו
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editHistory.length > 0 ? (
                <div className="space-y-4">
                  {editHistory.map((edit: any, index: number) => (
                    <Card key={index} className="overflow-hidden">
                      <CardHeader className="bg-secondary/20 py-3">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">שינוי סטטוס #{editHistory.length - index}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(edit.changed_at)}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{edit.from_status}</Badge>
                          <ArrowLeft className="h-4 w-4" />
                          <Badge>{edit.to_status}</Badge>
                        </div>
                        
                        {edit.note && (
                          <p className="whitespace-pre-line mt-2">{edit.note}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    אין היסטוריית עריכות למנה זו
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <ShareDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen}
        imageUrl={imageToShare || ''}
        itemName={submission.item_name_at_submission}
      />
              </div>
    </div>
  );
}
