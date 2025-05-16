import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useSubmissionStatus } from "@/hooks/useSubmissionStatus";
import { 
  ArrowLeft, 
  Clock, 
  Check, 
  Upload, 
  MessageCircle, 
  Image as ImageIcon,
  Trash2,
  Star,
  AlertCircle,
  Save,
  Edit,
  Eye
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { uploadFileToStorage } from "@/utils/storage-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SubmissionStatus } from "@/api/submissionApi";
import { toast } from "sonner";
import { FilePreviewGrid } from "@/components/food-vision/FilePreviewGrid";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const SubmissionProcessingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { 
    submission, 
    loading, 
    error, 
    updateSubmissionStatus, 
    setMainProcessedImage,
    addProcessedImage,
    removeProcessedImage,
    addInternalNote,
    respondToClientFeedback,
    getMaxEditsAllowed
  } = useSubmission(submissionId);
  const { updateStatus, isUpdating } = useSubmissionStatus();
  
  const [internalNote, setInternalNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [maxEdits, setMaxEdits] = useState<number>(1);
  const [responseToClient, setResponseToClient] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (submission?.main_processed_image_url) {
      setSelectedImage(submission.main_processed_image_url);
    }
    
    const fetchMaxEdits = async () => {
      const max = await getMaxEditsAllowed();
      setMaxEdits(max);
    };
    
    fetchMaxEdits();
  }, [submission]);
  
  if (loading) {
    return <div className="flex justify-center p-8">טוען פרטי הגשה...</div>;
  }
  
  if (error || !submission) {
    return (
      <Alert variant="destructive" className="mx-auto my-8 max-w-2xl">
        <AlertTitle>שגיאה בטעינת פרטי ההגשה</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "לא ניתן לטעון את פרטי ההגשה"}
        </AlertDescription>
      </Alert>
    );
  }
  
  const handleStatusChange = (status: string) => {
    updateStatus.mutate({ 
      submissionId: submission.submission_id,
      status: status as SubmissionStatus
    });
  };
  
  const handleAddInternalNote = async () => {
    if (!internalNote.trim()) return;
    
    try {
      await addInternalNote(internalNote);
      setInternalNote("");
    } catch (err) {
      console.error("Error saving internal note:", err);
    }
  };
  
  const handleSelectMainImage = async (imageUrl: string) => {
    if (imageUrl === submission.main_processed_image_url) return;
    
    try {
      await setMainProcessedImage(imageUrl);
      setSelectedImage(imageUrl);
    } catch (err) {
      console.error("Error setting main image:", err);
    }
  };
  
  const handleRemoveProcessedImage = async (imageUrl: string) => {
    try {
      await removeProcessedImage(imageUrl);
      if (selectedImage === imageUrl) {
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Error removing image:", err);
    }
  };
  
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };
  
  const handleUploadImages = async () => {
    if (!imageFiles.length) return;
    
    setUploadingImages(true);
    try {
      const uploadedUrls = [];
      
      for (const file of imageFiles) {
        const url = await uploadFileToStorage(file);
        if (url) {
          await addProcessedImage(url);
          uploadedUrls.push(url);
        }
      }
      
      // If this is the first image, set it as main
      if (uploadedUrls.length > 0 && !submission.main_processed_image_url) {
        await setMainProcessedImage(uploadedUrls[0]);
        setSelectedImage(uploadedUrls[0]);
      }
      
      setImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error uploading images:", err);
      toast.error("שגיאה בהעלאת התמונות");
    } finally {
      setUploadingImages(false);
    }
  };
  
  const handleMarkAsReady = async () => {
    if (!submission.processed_image_urls?.length || !submission.main_processed_image_url) {
      toast.error("יש להעלות לפחות תמונה מעובדת אחת ולבחור תמונה ראשית");
      return;
    }
    
    try {
      handleStatusChange("מוכנה להצגה");
      
      // If this was a response to client feedback, update the edit history
      if (submission.submission_status === "הערות התקבלו" && responseToClient.trim()) {
        await respondToClientFeedback(responseToClient, submission.processed_image_urls);
        setResponseToClient("");
      }
      
      toast.success("המשימה סומנה כמוכנה להצגה");
    } catch (err) {
      console.error("Error marking as ready:", err);
      toast.error("שגיאה בסימון המשימה כמוכנה");
    }
  };
  
  const handleSaveProgress = () => {
    toast.success("התקדמות נשמרה בהצלחה");
  };
  
  const handleRemoveFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const deadlineDate = submission.target_completion_date ? 
    new Date(submission.target_completion_date) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ממתינה לעיבוד": return "warning";
      case "בעיבוד": return "blue";
      case "מוכנה להצגה": return "success";
      case "הערות התקבלו": return "purple";
      case "הושלמה ואושרה": return "secondary";
      default: return "default";
    }
  };
  
  const editProgress = submission.edit_count || 0;
  const editProgressPercentage = Math.min(100, (editProgress / maxEdits) * 100);
  
  // Get the latest client feedback if available
  const latestClientFeedback = submission.edit_history && submission.edit_history.length > 0
    ? submission.edit_history[submission.edit_history.length - 1]
    : null;
  
  // Fix the existing image preview with badge section
  const imagePreviewSection = (url: string, index: number) => (
    <div key={index} className="relative group">
      <img
        src={url}
        alt={`תמונה מעובדת ${index + 1}`}
        className={`aspect-square object-cover rounded-md border cursor-pointer
          ${url === selectedImage ? 'border-2 border-primary' : 'border-gray-200'}`}
        onClick={() => setLightboxImage(url)}
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectMainImage(url);
            }}
            className="w-8 h-8 p-0 rounded-full"
            disabled={url === submission.main_processed_image_url}
            title="הגדר כתמונה ראשית"
          >
            <Star className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveProcessedImage(url);
            }}
            className="w-8 h-8 p-0 rounded-full"
            title="הסר תמונה"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {url === submission.main_processed_image_url && (
        <Badge 
          className="absolute top-2 right-2"
          variant="default" // Change from "primary" to "default"
        >
          ראשית
        </Badge>
      )}
    </div>
  );
  
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/editor/dashboard")}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          חזרה לדאשבורד
        </Button>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-6">
        {/* Main content - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">
                    {submission.item_name_at_submission}
                  </CardTitle>
                  <CardDescription>
                    מסעדה: {submission.clients?.restaurant_name}
                  </CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(submission.submission_status)}>
                  {submission.submission_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="images" className="mb-6">
                <TabsList className="mb-2">
                  <TabsTrigger value="images">תמונות</TabsTrigger>
                  <TabsTrigger value="client-feedback">משוב הלקוח</TabsTrigger>
                  <TabsTrigger value="internal-notes">הערות פנימיות</TabsTrigger>
                </TabsList>
                
                <TabsContent value="images" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Original images section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">תמונות מקוריות</h3>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {submission.original_item_id && 
                         submission.item_type === "dish" ? (
                          <div className="space-y-2">
                            <p>תמונות מקוריות של מנה #{submission.original_item_id}</p>
                          </div>
                        ) : submission.original_item_id && 
                           submission.item_type === "cocktail" ? (
                          <div className="space-y-2">
                            <p>תמונות מקוריות של קוקטייל #{submission.original_item_id}</p>
                          </div>
                        ) : submission.original_item_id && 
                           submission.item_type === "drink" ? (
                          <div className="space-y-2">
                            <p>תמונות מקוריות של משקה #{submission.original_item_id}</p>
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">אין תמונה מקורית</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Processed images section */}
                    <div>
                      <h3 className="text-lg font-medium mb-2">תמונות מעובדות</h3>
                      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        {submission.processed_image_urls?.length ? (
                          submission.processed_image_urls.map((url, idx) => (
                            imagePreviewSection(url, idx)
                          ))
                        ) : (
                          <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                            <p className="text-muted-foreground">אין תמונות מעובדות</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 space-y-4">
                        <div className="flex flex-col gap-2">
                          <label htmlFor="image-upload" className="text-sm font-medium">
                            העלאת תמונות מעובדות:
                          </label>
                          <input
                            id="image-upload"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <ImageIcon className="h-4 w-4 mr-1" />
                            בחירת קבצים
                          </Button>
                          
                          {imageFiles.length > 0 && (
                            <div className="mt-2">
                              <FilePreviewGrid
                                files={imageFiles}
                                onRemove={handleRemoveFile}
                                size={80}
                              />
                              <Button
                                variant="default"
                                size="sm"
                                disabled={uploadingImages}
                                onClick={handleUploadImages}
                                className="w-full mt-2"
                              >
                                {uploadingImages ? (
                                  "מעלה תמונות..."
                                ) : (
                                  <>
                                    <Upload className="h-4 w-4 mr-1" />
                                    העלאת {imageFiles.length} תמונות
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />
                  
                  {/* Image quality indicator */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">איכות תמונות</h3>
                    {submission.processed_image_urls?.length ? (
                      <div className="space-y-2">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            נא לוודא שהתמונות המעובדות עומדות בדרישות האיכות הבאות:
                            <ul className="list-disc list-inside mt-2">
                              <li>רזולוציה מינימלית: 1080x1080 פיקסלים</li>
                              <li>פורמט: JPG או PNG</li>
                              <li>יחס גובה-רוחב: מרובע או אורכי</li>
                              <li>התמונה ממוקדת וברורה</li>
                            </ul>
                          </AlertDescription>
                        </Alert>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין תמונות מ��ובדות לבדיקה</p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="client-feedback" className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">הערות והבקשות מהלקוח</h3>
                    {submission.edit_history?.length ? (
                      <div className="space-y-4">
                        {submission.edit_history.map((edit, idx) => (
                          <div key={idx} className="p-3 border rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium">בקשת עריכה #{idx + 1}</span>
                              <span className="text-xs text-muted-foreground">
                                {edit.timestamp ? formatDate(edit.timestamp) : ""}
                              </span>
                            </div>
                            {edit.client_request && (
                              <p className="text-sm mb-2">{edit.client_request}</p>
                            )}
                            {edit.editor_response && (
                              <div className="mt-2 bg-slate-50 p-2 rounded-md">
                                <p className="text-xs text-muted-foreground">תגובת העורך:</p>
                                <p className="text-sm">{edit.editor_response}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">אין הערות או בקשות מהלקוח</p>
                    )}
                    
                    {/* Edit progress indicator */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm">עריכות: {editProgress} מתוך {maxEdits}</span>
                        <span className="text-sm">{editProgressPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${editProgressPercentage >= 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${editProgressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Response to client feedback */}
                    {submission.submission_status === "הערות התקבלו" && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-md font-medium">תגובה לבקשת לקוח</h4>
                        <Textarea
                          placeholder="הוסף תגובה לבקשת העריכה של הלקוח..."
                          value={responseToClient}
                          onChange={(e) => setResponseToClient(e.target.value)}
                          className="mb-2"
                        />
                        <p className="text-xs text-muted-foreground">
                          התגובה תישלח ללקוח כאשר תסמן את המשימה כ"מוכנה להצגה"
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="internal-notes" className="space-y-4">
                  {/* Internal notes section */}
                  <div>
                    <h3 className="text-lg font-medium mb-2">הערות פנימיות</h3>
                    <div className="mb-3 bg-slate-50 p-3 rounded-md max-h-60 overflow-y-auto">
                      {submission.internal_team_notes ? (
                        <pre className="text-sm whitespace-pre-wrap font-sans">
                          {submission.internal_team_notes}
                        </pre>
                      ) : (
                        <p className="text-muted-foreground">אין הערות פנימיות</p>
                      )}
                    </div>
                    <Textarea
                      placeholder="הוסף הערה פנימית לגבי המשימה..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      className="mb-2"
                    />
                    <Button 
                      onClick={handleAddInternalNote}
                      disabled={!internalNote.trim()}
                      className="w-full"
                    >
                      שמור הערה פנימית
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex flex-wrap gap-2 justify-between mt-6">
                <Button 
                  variant="outline"
                  onClick={handleSaveProgress}
                  className="flex-1 md:flex-none"
                >
                  <Save className="h-4 w-4 mr-1" />
                  שמור התקדמות
                </Button>
                <Button 
                  onClick={handleMarkAsReady}
                  className="flex-1 md:flex-none"
                  disabled={!submission.processed_image_urls?.length || !submission.main_processed_image_url}
                >
                  <Check className="h-4 w-4 mr-1" />
                  סמן כ"מוכנה להצגה"
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>פרטי המשימה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">סוג פריט:</h4>
                <p>
                  {submission.item_type === "dish" ? "מנה" : 
                   submission.item_type === "cocktail" ? "קוקטייל" : "משקה"}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">תאריך העלאה:</h4>
                <p>{formatDate(submission.uploaded_at)}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">דדליין להשלמה:</h4>
                <div className="flex items-center gap-1">
                  <Clock className={`h-4 w-4 ${isOverdue ? "text-red-500" : ""}`} />
                  <p className={isOverdue ? "text-red-500 font-medium" : ""}>
                    {submission.target_completion_date ? 
                      formatDate(submission.target_completion_date) : 
                      "לא הוגדר"}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">עדיפות:</h4>
                <Badge variant={submission.priority === "High" ? "destructive" : 
                             submission.priority === "Low" ? "green" : "yellow"}>
                  {submission.priority || "Medium"}
                </Badge>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">מספר עריכות:</h4>
                <p>{submission.edit_count || 0} / {maxEdits}</p>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="text-sm font-medium mb-2">עדכן סטטוס:</h4>
                <Select
                  value={submission.submission_status}
                  onValueChange={handleStatusChange}
                  disabled={isUpdating}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סטטוס" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ממתינה לעיבוד">ממתינה לעיבוד</SelectItem>
                    <SelectItem value="בעיבוד">בעיבוד</SelectItem>
                    <SelectItem value="מוכנה להצגה">מוכנה להצגה</SelectItem>
                    <SelectItem value="זקוק לבדיקת מנהל">זקוק לבדיקת מנהל</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                className="w-full"
                disabled={submission.submission_status === "מוכנה להצגה"}
                onClick={() => handleStatusChange("מוכנה להצגה")}
              >
                <Check className="h-4 w-4 mr-1" />
                סמן כ"מוכנה להצגה"
              </Button>
            </CardFooter>
          </Card>
          
          {/* Client profile link and communication section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                מידע נוסף
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">פרופיל הלקוח:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/clients/${submission.client_id}`)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  צפייה בפרופיל הלקוח
                </Button>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">פרטי הפריט המקורי:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!submission.original_item_id}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  צפייה בפריט המקורי
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Image lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl h-auto">
          <DialogHeader>
            <DialogTitle>תצוגה מקדימה</DialogTitle>
          </DialogHeader>
          {lightboxImage && (
            <img 
              src={lightboxImage} 
              alt="תצוגה מקדימה" 
              className="w-full h-auto object-contain max-h-[70vh]" 
            />
          )}
          <DialogFooter>
            <Button onClick={() => setLightboxImage(null)}>סגור</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubmissionProcessingPage;
