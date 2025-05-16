
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useSubmissionStatus } from "@/hooks/useSubmissionStatus";
import { ArrowLeft, Clock, Check, Upload, MessageCircle } from "lucide-react";
import { formatDate } from "@/utils/formatDate";
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

const SubmissionProcessingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const { submission, loading, error } = useSubmission(submissionId);
  const { updateStatus, isUpdating } = useSubmissionStatus();
  const [internalNote, setInternalNote] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
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
  
  const addInternalNote = async () => {
    if (!internalNote.trim()) return;
    
    try {
      await updateStatus.mutateAsync({
        submissionId: submission.submission_id,
        status: submission.submission_status
      });
      
      setInternalNote("");
      toast.success("ההערה הפנימית נשמרה בהצלחה");
    } catch (err) {
      console.error("Error saving internal note:", err);
    }
  };
  
  const addProcessedImage = async () => {
    if (!imageUrl.trim()) return;
    
    try {
      // Logic to add processed image - this would typically involve
      // file upload logic which we'll implement later
      setImageUrl("");
      toast.success("התמונה המעובדת נוספה בהצלחה");
    } catch (err) {
      console.error("Error adding processed image:", err);
    }
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
              <div className="grid gap-6 md:grid-cols-2">
                {/* Original images section */}
                <div>
                  <h3 className="text-lg font-medium mb-2">תמונות מקוריות</h3>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {/* This would display the original images, but for now we'll show placeholders */}
                    <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                      <p className="text-muted-foreground">אין תמונה מקורית</p>
                    </div>
                  </div>
                </div>
                
                {/* Processed images section */}
                <div>
                  <h3 className="text-lg font-medium mb-2">תמונות מעובדות</h3>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {submission.processed_image_urls?.length ? (
                      submission.processed_image_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`תמונה מעובדת ${idx + 1}`}
                          className="aspect-square object-cover rounded-md border"
                        />
                      ))
                    ) : (
                      <div className="aspect-square bg-muted rounded-md flex items-center justify-center">
                        <p className="text-muted-foreground">אין תמונות מעובדות</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <p className="text-sm text-muted-foreground">הוסף תמונה מעובדת:</p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="קישור לתמונה מעובדת"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addProcessedImage}
                        disabled={!imageUrl.trim()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        הוסף
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Client requests/notes section */}
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
                        <p className="text-sm">{edit.client_request}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">אין הערות או בקשות מהלקוח</p>
                )}
              </div>
              
              <Separator className="my-6" />
              
              {/* Internal notes section */}
              <div>
                <h3 className="text-lg font-medium mb-2">הערות פנימיות</h3>
                <Textarea
                  placeholder="הוסף הערה פנימית לגבי המשימה..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="mb-2"
                />
                <Button 
                  onClick={addInternalNote}
                  disabled={!internalNote.trim()}
                  className="w-full"
                >
                  שמור הערה פנימית
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
                <p>{submission.edit_count || 0}</p>
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                תקשורת
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                אפשרויות תקשורת עם צוות פנימי או לקוחות יוצגו כאן
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmissionProcessingPage;
