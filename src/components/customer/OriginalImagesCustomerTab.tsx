
import React from 'react';
import { Submission } from "@/api/submissionApi";
import { useOriginalImages } from "@/hooks/useOriginalImages";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Image as ImageIcon, Maximize } from "lucide-react";

interface OriginalImagesCustomerTabProps {
  submission: Submission;
  onImageClick: (imageUrl: string | null) => void;
}

const OriginalImagesCustomerTab: React.FC<OriginalImagesCustomerTabProps> = ({ 
  submission, 
  onImageClick 
}) => {
  const { 
    data: originalImages, 
    isLoading: isLoadingOriginalImages, 
    error: errorOriginalImages 
  } = useOriginalImages(submission.submission_id);

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
          {errorOriginalImages.message || "לא ניתן היה לטעון את התמונות המקוריות שלכם/ן."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!originalImages || originalImages.length === 0) {
    return (
      <div className="text-center py-10">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">לא הועלו תמונות מקוריות עבור פריט זה.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      <p className="text-sm text-muted-foreground">
        אלו התמונות המקוריות שהעליתם/ן עבור פריט זה. צוות העריכה ישתמש בהן כרפרנס.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {originalImages.map((url, index) => (
          <div 
            key={index} 
            className="relative group aspect-square cursor-pointer overflow-hidden rounded-md border border-muted"
            onClick={() => onImageClick(url)}
          >
            <img 
              src={url} 
              alt={`תמונה מקורית ${index + 1}`} 
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize className="h-8 w-8 text-white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OriginalImagesCustomerTab;
