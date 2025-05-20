import React from 'react';
import { Submission } from "@/api/submissionApi";
import { useOriginalImages, SubmissionItemType } from "@/hooks/useOriginalImages";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Image as ImageIcon } from "lucide-react";

interface OriginalImagesTabContentProps {
  submission: Submission;
  setLightboxImage: (imageUrl: string | null) => void; // To allow opening images in lightbox
}

const OriginalImagesTabContent: React.FC<OriginalImagesTabContentProps> = ({ 
  submission, 
  setLightboxImage 
}) => {
  const itemTypeForHook: SubmissionItemType = submission.item_type;
  const { 
    data: originalImages, 
    isLoading: isLoadingOriginalImages, 
    error: errorOriginalImages 
  } = useOriginalImages(submission.original_item_id, itemTypeForHook);

  if (isLoadingOriginalImages) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        טוען תמונות מקוריות...
      </div>
    );
  }

  if (errorOriginalImages) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>שגיאה בטעינת תמונות מקוריות</AlertTitle>
        <AlertDescription>
          {errorOriginalImages.message || "לא ניתן היה לטעון את התמונות המקוריות מהלקוח."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!originalImages || originalImages.length === 0) {
    return (
      <div className="text-center py-10">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">הלקוח לא העלה תמונות מקוריות עבור פריט זה.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <h3 className="text-lg font-medium mb-2">תמונות מקוריות מהלקוח</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {originalImages.map((url, index) => (
          <div key={index} className="relative group aspect-square cursor-pointer">
            <img 
              src={url} 
              alt={`תמונה מקורית ${index + 1}`} 
              className="w-full h-full object-cover rounded-md border border-muted hover:opacity-80 transition-opacity"
              onClick={() => setLightboxImage(url)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default OriginalImagesTabContent; 