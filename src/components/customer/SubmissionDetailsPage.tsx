import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useMessages } from "@/hooks/useMessages";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, Download, Edit, MessageSquare, Send, Share2, Facebook, Instagram, Mail, Link as LinkIcon, Maximize } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShareDialog } from "./ShareDialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import OriginalImagesCustomerTab from "./OriginalImagesCustomerTab";

// Status badge variant mapping
const statusBadgeVariant: Record<string, string> = {
  "ממתינה לעיבוד": "yellow",
  "בעיבוד": "blue",
  "מוכנה להצגה": "purple",
  "הערות התקבלו": "warning",
  "הושלמה ואושרה": "green"
};

export function SubmissionDetailsPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { submission, loading: submissionLoading, error: submissionError, requestEdit, updateSubmissionStatus, setMainProcessedImage } = useSubmission(submissionId);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(submissionId);
  
  const [editNote, setEditNote] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [imageToShare, setImageToShare] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleRequestEdit = async () => {
    if (!editNote.trim()) {
      toast({
        title: "שגיאה",
        description: "נא להזין הערות לעריכה",
        variant: "destructive",
      });
      return;
    }
    
    const success = await requestEdit(editNote);
    
    if (success) {
      toast({
        title: "בקשת עריכה נשלחה",
        description: "בקשת העריכה שלך התקבלה ותטופל בקרוב",
      });
      setEditNote("");
      setEditDialogOpen(false);
    } else {
      toast({
        title: "שגיאה בשליחת בקשת העריכה",
        description: "אירעה שגיאה בעת שליחת בקשת העריכה. אנא נסה שוב מאוחר יותר.",
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
        description: "אירעה שגיאה בעת אישור המנה. אנא נסה שוב מאוחר יותר.",
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
        description: "ההודעה שלך נשלחה לצוות העריכה",
      });
    } else {
      toast({
        title: "שגיאה בשליחת ההודעה",
        description: "אירעה שגיאה בעת שליחת ההודעה. אנא נסה שוב מאוחר יותר.",
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
        description: "אירעה שגיאה בעת עדכון התמונה הראשית. אנא נסה שוב מאוחר יותר.",
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
      description: "התמונה מורדת למחשב שלך",
    });
  };

  const handleShareImage = (imageUrl: string) => {
    setImageToShare(imageUrl);
    setShareDialogOpen(true);
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
            אירעה שגיאה בעת טעינת פרטי ההגשה. אנא נסה שוב מאוחר יותר.
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

  // Check if the submission has processed images
  const hasProcessedImages = submission.processed_image_urls && submission.processed_image_urls.length > 0;
  
  // Check if this submission can be edited
  const canRequestEdit = submission.submission_status === "מוכנה להצגה";
  
  // Check if this submission can be approved
  const canApprove = submission.submission_status === "מוכנה להצגה";
  
  // Check if images can be downloaded or shared
  const canDownload = submission.submission_status === "הושלמה ואושרה";
  const canShare = submission.submission_status === "הושלמה ואושרה";
  
  // Parse the edit history if available
  const editHistory = submission.edit_history?.status_changes || [];

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-2">
            <Link to="/customer/submissions">
              <ArrowLeft className="ml-2 h-4 w-4" />
              חזרה לרשימת ההגשות
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{submission.item_name_at_submission}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={statusBadgeVariant[submission.submission_status] as any}>
              {submission.submission_status}
            </Badge>
            <span className="text-sm text-muted-foreground">הועלה בתאריך: {formatDate(submission.uploaded_at)}</span>
          </div>
        </div>
        
        <div className="flex gap-2">
          {canRequestEdit && (
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Edit className="ml-2 h-4 w-4" />
                  בקש עריכה
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>בקשת עריכה</DialogTitle>
                  <DialogDescription>
                    תאר את השינויים שתרצה לראות בתמונה המעובדת
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Textarea
                    placeholder="תאר את העריכות הנדרשות..."
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
                    שלח בקשה
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {canApprove && (
            <Button onClick={handleApprove}>
              <Check className="ml-2 h-4 w-4" />
              אשר מנה
            </Button>
          )}
        </div>
      </div>
      
      {/* Lightbox Dialog for selectedImage */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl p-0">
            <img src={selectedImage} alt="Selected Preview" className="max-h-[80vh] w-auto mx-auto" />
          </DialogContent>
        </Dialog>
      )}

      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-lg mb-4">
          <TabsTrigger value="images">תמונות</TabsTrigger>
          <TabsTrigger value="originals">תמונות מקוריות</TabsTrigger>
          <TabsTrigger value="editHistory">היסטוריית עריכות</TabsTrigger>
          <TabsTrigger value="messages">תקשורת</TabsTrigger>
        </TabsList>
        
        {/* Images Tab */}
        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle>תמונות מעובדות</CardTitle>
              <CardDescription>
                {hasProcessedImages 
                  ? "צפה בתמונות המעובדות של המנה" 
                  : "אין תמונות מעובדות עדיין"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasProcessedImages ? (
                <div className="space-y-6">
                  {/* Main image display */}
                  {submission.main_processed_image_url && (
                    <div className="relative rounded-lg overflow-hidden border-2 border-primary">
                      <div className="aspect-video max-h-[400px] overflow-hidden flex items-center justify-center">
                        <img 
                          src={submission.main_processed_image_url} 
                          alt={`${submission.item_name_at_submission} - תמונה ראשית`}
                          className="object-contain w-full h-full"
                        />
                        
                        {/* Watermark for preview mode */}
                        {submission.submission_status === "מוכנה להצגה" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-white text-3xl font-bold opacity-30 rotate-[330deg]">
                              תצוגה מקדימה - Food Vision AI
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons for main image */}
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          onClick={() => setSelectedImage(submission.main_processed_image_url)}
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                        
                        {canDownload && (
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            onClick={() => handleDownloadImage(submission.main_processed_image_url!)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {canShare && (
                          <Button 
                            size="icon" 
                            variant="secondary" 
                            onClick={() => handleShareImage(submission.main_processed_image_url!)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* All processed images carousel */}
                  <div className="py-4">
                    <h3 className="text-lg font-medium mb-4">כל התמונות ({submission.processed_image_urls.length})</h3>
                    
                    <Carousel className="w-full">
                      <CarouselContent>
                        {submission.processed_image_urls.map((imageUrl, index) => (
                          <CarouselItem key={index} className="md:basis-1/3">
                            <div className="p-1">
                              <div className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                imageUrl === submission.main_processed_image_url ? 'border-primary' : 'border-transparent'
                              }`}>
                                <img 
                                  src={imageUrl} 
                                  alt={`${submission.item_name_at_submission} - ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onClick={() => setSelectedImage(imageUrl)}
                                />
                                
                                {/* Watermark for preview mode */}
                                {submission.submission_status === "מוכנה להצגה" && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <p className="text-white text-xs font-bold opacity-30 rotate-[330deg]">
                                      תצוגה מקדימה
                                    </p>
                                  </div>
                                )}
                                
                                {/* Overlay with buttons */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-2">
                                  {(submission.submission_status === "מוכנה להצגה" || submission.submission_status === "הערות התקבלו") && (
                                    <Button 
                                      variant="secondary" 
                                      className="text-sm"
                                      onClick={() => handleSetMainImage(imageUrl)}
                                    >
                                      {imageUrl === submission.main_processed_image_url 
                                        ? "תמונה ראשית" 
                                        : "הגדר כתמונה ראשית"}
                                    </Button>
                                  )}
                                  
                                  <div className="flex gap-2 mt-2">
                                    {canDownload && (
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        onClick={() => handleDownloadImage(imageUrl)}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                    
                                    {canShare && (
                                      <Button 
                                        size="icon" 
                                        variant="outline" 
                                        onClick={() => handleShareImage(imageUrl)}
                                      >
                                        <Share2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="right-auto left-1" />
                      <CarouselNext className="left-auto right-1" />
                    </Carousel>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">
                    טרם הועלו תמונות מעובדות למנה זו. 
                    {submission.submission_status === "ממתינה לעיבוד" || submission.submission_status === "בעיבוד" 
                      ? " המנה נמצאת בעיבוד, התמונות יופיעו כאן כשיהיו מוכנות."
                      : ""}
                  </p>
                </div>
              )}
              
              {/* Image Preview Dialog */}
              {selectedImage && (
                <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
                  <DialogContent className="sm:max-w-[900px] md:max-w-[1100px] p-1">
                    <img 
                      src={selectedImage} 
                      alt="תמונה מוגדלת"
                      className="w-full h-full object-contain max-h-[80vh]"
                    />
                    
                    {/* Watermark for preview mode */}
                    {submission.submission_status === "מוכנה להצגה" && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <p className="text-white text-4xl font-bold opacity-30 rotate-[330deg]">
                          תצוגה מקדימה - Food Vision AI
                        </p>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    {submission.submission_status === "הושלמה ואושרה" && (
                      <div className="absolute bottom-4 right-4 flex gap-2">
                        <Button 
                          variant="secondary" 
                          onClick={() => handleDownloadImage(selectedImage)}
                        >
                          <Download className="ml-2 h-4 w-4" />
                          הורד תמונה
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            handleShareImage(selectedImage);
                            setSelectedImage(null);
                          }}
                        >
                          <Share2 className="ml-2 h-4 w-4" />
                          שתף תמונה
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Share Dialog */}
              <ShareDialog 
                open={shareDialogOpen} 
                onOpenChange={setShareDialogOpen}
                imageUrl={imageToShare || ''}
                itemName={submission.item_name_at_submission}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Original Images Tab - New */}
        <TabsContent value="originals">
          <Card>
            <CardHeader>
              <CardTitle>תמונות מקוריות</CardTitle>
              <CardDescription>
                אלו התמונות שהעלית במקור עבור פריט זה.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OriginalImagesCustomerTab 
                submission={submission} 
                onImageClick={setSelectedImage} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Edit History Tab */}
        <TabsContent value="editHistory">
          <Card>
            <CardHeader>
              <CardTitle>היסטוריית עריכות</CardTitle>
              <CardDescription>
                רשימת בקשות העריכה והשינויים שנעשו
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
        
        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>תקשורת</CardTitle>
              <CardDescription>
                שלח הודעות לצוות העריכה וצפה בהיסטוריית ההודעות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col h-[400px]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-3/4" />
                      <Skeleton className="h-20 w-3/4 mr-auto" />
                      <Skeleton className="h-20 w-3/4" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div 
                        key={message.message_id} 
                        className={`flex ${message.sender_type === 'client' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.sender_type === 'client' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          <p className="whitespace-pre-line">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender_type === 'client' 
                              ? 'text-primary-foreground/70' 
                              : 'text-secondary-foreground/70'
                          }`}>
                            {new Date(message.timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-muted-foreground">
                        <MessageSquare className="mx-auto h-12 w-12 opacity-20" />
                        <p className="mt-2">אין הודעות עדיין</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Textarea
                    placeholder="כתוב הודעה..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="resize-none"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
