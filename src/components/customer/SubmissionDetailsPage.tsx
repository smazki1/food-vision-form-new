import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useMessages } from "@/hooks/useMessages";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, Download, Edit, MessageSquare, Send } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  
  const handleDownloadImages = () => {
    // For now, just open the main image in a new tab
    if (submission?.main_processed_image_url) {
      window.open(submission.main_processed_image_url, '_blank');
    } else if (submission?.processed_image_urls && submission.processed_image_urls.length > 0) {
      window.open(submission.processed_image_urls[0], '_blank');
    }
    
    toast({
      title: "הורדת תמונות",
      description: "התמונות נפתחות בחלון חדש. ניתן לשמור אותן למחשב.",
    });
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
  
  // Check if images can be downloaded
  const canDownload = submission.submission_status === "הושלמה ואושרה";
  
  // Parse the edit history if available
  const editHistory = Array.isArray(submission.edit_history) ? submission.edit_history : [];

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
            <Button variant="outline" onClick={handleApprove}>
              <Check className="ml-2 h-4 w-4" />
              אשר מנה
            </Button>
          )}
          
          {canDownload && (
            <Button variant="secondary" onClick={handleDownloadImages}>
              <Download className="ml-2 h-4 w-4" />
              הורד תמונות
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="images">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="images">תמונות</TabsTrigger>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submission.processed_image_urls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${imageUrl === submission.main_processed_image_url ? 'border-primary' : 'border-transparent'}`}>
                        <img 
                          src={imageUrl} 
                          alt={`${submission.item_name_at_submission} - ${index + 1}`}
                          className="w-full h-full object-cover"
                          onClick={() => setSelectedImage(imageUrl)}
                        />
                      </div>
                      {(submission.submission_status === "מוכנה להצגה" || submission.submission_status === "הערות התקבלו") && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Button 
                            variant="secondary" 
                            className="text-sm"
                            onClick={() => handleSetMainImage(imageUrl)}
                          >
                            {imageUrl === submission.main_processed_image_url 
                              ? "תמונה ראשית" 
                              : "הגדר כתמונה ראשית"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
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
                  <DialogContent className="sm:max-w-[800px] p-1">
                    <img 
                      src={selectedImage} 
                      alt="תמונה מוגדלת"
                      className="w-full h-full object-contain"
                    />
                  </DialogContent>
                </Dialog>
              )}
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
                          <p className="font-medium">בקשת עריכה #{editHistory.length - index}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(edit.timestamp)}
                          </p>
                        </div>
                      </CardHeader>
                      <CardContent className="py-3">
                        <p className="whitespace-pre-line">{edit.client_request}</p>
                        
                        {edit.team_response && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="font-medium mb-2">תשובת הצוות:</p>
                            <p className="whitespace-pre-line">{edit.team_response}</p>
                          </div>
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
