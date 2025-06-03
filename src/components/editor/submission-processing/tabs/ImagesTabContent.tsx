import React, { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Submission } from "@/api/submissionApi";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { uploadFileToStorage } from "@/utils/storage-utils";
import { Info, Upload, Check, AlertTriangle, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubmissionStatusTracking } from "@/hooks/useSubmissionStatusTracking";
import { useSupabaseUserId } from "@/hooks/useSupabaseUserId";
import { supabase } from "@/integrations/supabase/client";

interface ImagesTabContentProps {
  submission: Submission;
  handleSelectMainImage: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage: (imageUrl: string) => Promise<boolean>;
  addProcessedImage: (url: string) => Promise<boolean>;
  setLightboxImage: (imageUrl: string | null) => void;
}

const ImagesTabContent = ({
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  setLightboxImage,
}: ImagesTabContentProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { userId } = useSupabaseUserId();
  const { updateStatus } = useSubmissionStatusTracking();
  
  const hasProcessedImages = submission.processed_image_urls && submission.processed_image_urls.length > 0;
  
  const hasMainImage = !!submission.main_processed_image_url;
  
  const isReadyForClient = hasProcessedImages && hasMainImage && 
    submission.submission_status !== "מוכנה להצגה" && 
    submission.submission_status !== "הושלמה ואושרה";
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files).filter(file => file.type.startsWith('image/'));
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };
  
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // Upload the file to storage
        const imageUrl = await uploadFileToStorage(file);
        if (imageUrl) {
          // Add the image URL to the submission
          await addProcessedImage(imageUrl);
          
          // If it's the first processed image, automatically set it as the main image
          if (!submission.main_processed_image_url && 
              (!submission.processed_image_urls || submission.processed_image_urls.length === 0)) {
            await handleSelectMainImage(imageUrl);
          }
          
          // Create notification for client if status is ready to display
          if (submission.submission_status === "מוכנה להצגה" && userId) {
            try {
              // TypeScript casting to any to avoid type error with notifications table
              await (supabase
                .from("notifications") as any)
                .insert({
                  user_id: submission.client_id,
                  message: `תמונה חדשה התווספה ל${submission.item_name_at_submission}`,
                  link: `/customer/submissions/${submission.submission_id}`,
                  related_entity_id: submission.submission_id,
                  related_entity_type: "submission"
                });
            } catch (error) {
              console.error("Error sending notification:", error);
            }
          }
        }
      }
      
      // Clear the selected files
      setSelectedFiles([]);
      
      // Show success toast
      toast({
        title: "התמונות הועלו בהצלחה",
        description: `${selectedFiles.length} תמונות הועלו בהצלחה`,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "שגיאה בהעלאת תמונות",
        description: "אירעה שגיאה בעת העלאת התמונות. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  const handleMarkAsReady = async () => {
    if (!hasProcessedImages || !hasMainImage) {
      toast({
        title: "לא ניתן לסמן כמוכן להצגה",
        description: "יש להעלות לפחות 4 תמונות ולהגדיר תמונה ראשית",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateStatus.mutateAsync({
        submissionId: submission.submission_id,
        status: "מוכנה להצגה",
        note: "המשימה מוכנה לבדיקת הלקוח"
      });
      
      toast({
        title: "המשימה מוכנה להצגה",
        description: "הלקוח יקבל התראה שהמשימה מוכנה לבחינה",
      });
    } catch (error) {
      console.error("Error marking as ready:", error);
      toast({
        title: "שגיאה בעדכון סטטוס",
        description: "אירעה שגיאה בעת עדכון סטטוס המשימה",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
          <div className="space-y-6">
            <Alert className="bg-muted">
              <Info className="h-4 w-4" />
              <AlertTitle>העלאת תמונות מעובדות</AlertTitle>
              <AlertDescription>
                העלה את התמונות המעובדות סופית שתרצה להציג ללקוח. הלקוח יוכל לאשר את התמונות או לבקש עריכות נוספות.
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>העלה רק תמונות באיכות גבוהה (לפחות 1500x1000 פיקסלים)</li>
                  <li>ניתן להעלות מספר גרסאות של אותה תמונה</li>
                  <li>חובה לבחור תמונה ראשית שתוצג ללקוח כבחירה מועדפת</li>
                </ul>
              </AlertDescription>
            </Alert>
            
            {submission.submission_status === "מוכנה להצגה" && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>המשימה כבר מוכנה לבדיקת לקוח</AlertTitle>
                <AlertDescription>
                  התמונות כבר זמינות לצפייה של הלקוח. ניתן להוסיף תמונות נוספות אם יש צורך.
                </AlertDescription>
              </Alert>
            )}
            
            {submission.submission_status === "הושלמה ואושרה" && (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertTitle>המשימה הושלמה ואושרה</AlertTitle>
                <AlertDescription>
                  הלקוח אישר את התמונות ומשימה זו הסתיימה.
                </AlertDescription>
              </Alert>
            )}
            
            {/* File upload section */}
            <div className="border rounded-md p-6">
              <h3 className="text-lg font-medium mb-4">העלאת תמונות</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer block">
                      <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">לחץ כאן לבחירת תמונות</p>
                      <p className="text-xs text-muted-foreground mt-1">או גרור לכאן קבצים</p>
                    </label>
                  </div>
                  
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading || selectedFiles.length === 0}
                    className="w-full"
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <span className="animate-spin mr-1">◌</span> 
                        מעלה תמונות...
                      </span>
                    ) : (
                      <span>העלה {selectedFiles.length} תמונות</span>
                    )}
                  </Button>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">תמונות שנבחרו להעלאה</h4>
                  {selectedFiles.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt={`תצוגה מקדימה ${index + 1}`}
                            className="h-20 w-full object-cover rounded-md"
                          />
                          <button 
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">לא נבחרו תמונות</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Options for marking ready for client */}
            <div className="border rounded-md p-6 bg-muted/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium">סיום עיבוד והצגה ללקוח</h3>
                  <p className="text-sm text-muted-foreground">
                    לאחר שסיימת לעבד את התמונות וברצונך להציגן ללקוח לבחינה ואישור
                  </p>
                </div>
                
                {isReadyForClient ? (
                  <Button onClick={handleMarkAsReady}>
                    <Check className="mr-2 h-4 w-4" />
                    סמן כמוכן להצגה ללקוח
                  </Button>
                ) : (
                  <Button disabled={!hasProcessedImages}>
                    {!hasProcessedImages ? (
                      "נדרשת לפחות תמונה אחת"
                    ) : !hasMainImage ? (
                      "נדרשת בחירת תמונה ראשית"
                    ) : (
                      "משימה כבר מוכנה להצגה"
                    )}
                  </Button>
                )}
              </div>
              
              {hasProcessedImages && !hasMainImage && (
                <Alert variant="destructive" className="mt-4"> {/* Changed from "warning" to "destructive" */}
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>לא נבחרה תמונה ראשית</AlertTitle>
                  <AlertDescription>
                    חובה לבחור תמונה ראשית שתוצג ללקוח באופן בולט
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
      
      <Separator className="my-8" />
        
      <h2 className="text-xl font-semibold">תצוגה מקדימה של תמונות מעובדות</h2>
          {!hasProcessedImages ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">אין תמונות מעובדות להצגה</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-1 mb-4">
                <Badge variant="outline">סך הכל: {submission.processed_image_urls?.length || 0} תמונות</Badge>
                {submission.main_processed_image_url && (
                  <Badge variant="secondary">תמונה ראשית נבחרה</Badge>
                )}
                <Badge variant={submission.submission_status === "מוכנה להצגה" ? "green" : "yellow"}>
                  {submission.submission_status}
                </Badge>
              </div>
              
              {submission.main_processed_image_url && (
                <div className="space-y-2">
                  <h3 className="text-md font-medium">תמונה ראשית</h3>
                  <div className="relative aspect-video border rounded-md overflow-hidden">
                    <img 
                      src={submission.main_processed_image_url} 
                      alt="תמונה ראשית" 
                      className="w-full h-full object-contain"
                      onClick={() => setLightboxImage(submission.main_processed_image_url)}
                    />
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <h3 className="text-md font-medium">כל התמונות המעובדות</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {submission.processed_image_urls?.map((url, index) => (
                    <div key={index} className="relative group">
                      <div 
                        className={`aspect-square rounded-md overflow-hidden border-2 ${
                          url === submission.main_processed_image_url ? 'border-primary' : 'border-muted'
                        }`}
                      >
                        <img 
                          src={url} 
                          alt={`תמונה מעובדת ${index + 1}`} 
                          className="w-full h-full object-cover"
                          onClick={() => setLightboxImage(url)}
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleSelectMainImage(url)}
                          >
                            {url === submission.main_processed_image_url 
                              ? "תמונה ראשית" 
                              : "הגדר כראשית"}
                          </Button>
                          
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            className="text-xs"
                            onClick={() => handleRemoveProcessedImage(url)}
                          >
                            הסר תמונה
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
    </div>
  );
};

export default ImagesTabContent;
