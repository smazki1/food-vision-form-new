import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSubmission } from "@/hooks/useSubmission";
import { useSubmissionStatus } from "@/hooks/useSubmissionStatus";
import { Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

// Import the new component files
import SubmissionHeader from "@/components/editor/submission/SubmissionHeader";
import LightboxDialog from "@/components/editor/submission/LightboxDialog";
import SubmissionSidebar from "@/components/editor/submission/SubmissionSidebar";
import ImagesTab from "@/components/editor/submission/ImagesTab";
import ClientFeedbackTab from "@/components/editor/submission/ClientFeedbackTab";
import InternalNotesTab from "@/components/editor/submission/InternalNotesTab";

const SubmissionProcessingPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  
  const { 
    submission, 
    loading, 
    error, 
    setMainProcessedImage,
    addProcessedImage,
    removeProcessedImage,
    addInternalNote,
    respondToClientFeedback,
    getMaxEditsAllowed
  } = useSubmission(submissionId);
  
  const { updateStatus, isUpdating } = useSubmissionStatus();
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [maxEdits, setMaxEdits] = useState<number>(1);
  const [responseToClient, setResponseToClient] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (submission?.main_processed_image_url) {
      setSelectedImage(submission.main_processed_image_url);
    }
    
    const fetchMaxEdits = async () => {
      const max = await getMaxEditsAllowed();
      setMaxEdits(max);
    };
    
    fetchMaxEdits();
  }, [submission, getMaxEditsAllowed]);
  
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
      submissionId: submission?.submission_id || "",
      status: status as any
    });
  };
  
  const handleAddInternalNote = async (note: string) => {
    if (!note.trim()) return;
    
    try {
      await addInternalNote(note);
    } catch (err) {
      console.error("Error saving internal note:", err);
    }
  };
  
  const handleSelectMainImage = async (imageUrl: string) => {
    if (imageUrl === submission?.main_processed_image_url) return;
    
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
  
  const handleMarkAsReady = async () => {
    if (!submission?.processed_image_urls?.length || !submission.main_processed_image_url) {
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
  
  return (
    <div className="px-4 py-6 md:px-6">
      <SubmissionHeader />
      
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
                <Badge variant={
                  submission.submission_status === "ממתינה לעיבוד" ? "warning" :
                  submission.submission_status === "בעיבוד" ? "blue" :
                  submission.submission_status === "מוכנה להצגה" ? "success" :
                  submission.submission_status === "הערות התקבלו" ? "purple" :
                  submission.submission_status === "הושלמה ואושרה" ? "secondary" :
                  "default"
                }>
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
                
                <TabsContent value="images">
                  <ImagesTab 
                    submission={submission}
                    handleSelectMainImage={handleSelectMainImage}
                    handleRemoveProcessedImage={handleRemoveProcessedImage}
                    addProcessedImage={addProcessedImage}
                    setLightboxImage={setLightboxImage}
                  />
                </TabsContent>
                
                <TabsContent value="client-feedback">
                  <ClientFeedbackTab 
                    submission={submission}
                    maxEdits={maxEdits}
                    responseToClient={responseToClient}
                    setResponseToClient={setResponseToClient}
                  />
                </TabsContent>
                
                <TabsContent value="internal-notes">
                  <InternalNotesTab 
                    internalTeamNotes={submission.internal_team_notes}
                    onAddNote={handleAddInternalNote}
                  />
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
        <div className="lg:col-span-2">
          <SubmissionSidebar 
            submission={submission}
            maxEdits={maxEdits}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdating}
          />
        </div>
      </div>
      
      {/* Image lightbox */}
      <LightboxDialog 
        imageUrl={lightboxImage} 
        onClose={() => setLightboxImage(null)}
        open={!!lightboxImage}
      />
    </div>
  );
};

export default SubmissionProcessingPage;
