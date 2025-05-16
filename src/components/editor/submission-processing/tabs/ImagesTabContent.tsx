
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Submission } from "@/api/submissionApi";
import { ImageIcon, Trash, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMaxEdits } from "../hooks/useMaxEdits";

interface ImagesTabContentProps {
  submission: Submission;
  handleSelectMainImage: (imageUrl: string) => Promise<boolean>;
  handleRemoveProcessedImage: (imageUrl: string) => Promise<boolean>;
  addProcessedImage: (imageUrl: string) => Promise<boolean>;
  setLightboxImage?: (imageUrl: string | null) => void;
}

const ImagesTabContent: React.FC<ImagesTabContentProps> = ({
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  setLightboxImage
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { maxEdits, currentEditCount } = useMaxEdits(submission);
  const isMaxEditsReached = maxEdits && currentEditCount >= maxEdits;
  
  // Parse the original image URLs from the submission
  const originalImages = useMemo(() => {
    const itemType = submission.item_type;
    let imageUrls: string[] = [];
    
    if (itemType === 'dish') {
      // For now, we'll just work with processed images directly
      // In a complete implementation, you'd fetch the original dish/item details
      imageUrls = submission.processed_image_urls || [];
    }
    
    return imageUrls;
  }, [submission]);

  // Handle image file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const filename = `${Date.now()}-${file.name}`;
      const filePath = `submissions/${submission.submission_id}/${filename}`;
      
      // Update file upload options to use onUploadProgress correctly
      const { data, error } = await supabase.storage
        .from('processed-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('processed-images')
        .getPublicUrl(filePath);
      
      // Add to processed images
      const success = await addProcessedImage(publicUrl);
      
      if (success) {
        // Create notification for client if status is appropriate
        if (submission.submission_status === "מוכנה להצגה" || submission.submission_status === "בעיבוד") {
          // Get client user ID from client record
          const { data: clientData } = await supabase
            .from('clients')
            .select('user_auth_id')
            .eq('client_id', submission.client_id)
            .single();
            
          if (clientData?.user_auth_id) {
            // Temporarily cast to any to avoid TypeScript errors until Supabase types are updated
            await (supabase
              .from('notifications') as any)
              .insert({
                user_id: clientData.user_auth_id,
                message: `תמונה חדשה נוספה למנה ${submission.item_name_at_submission}`,
                link: `/customer/submissions/${submission.submission_id}`,
                related_entity_id: submission.submission_id,
                related_entity_type: "submission",
                read_status: false
              });
          }
        }
      }
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Add image from URL
  const handleAddImageFromUrl = async () => {
    if (!imageUrl.trim()) return;
    
    setIsUploading(true);
    try {
      // Add the URL to processed images
      await addProcessedImage(imageUrl);
      setImageUrl("");
    } catch (error) {
      console.error("Error adding image from URL:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle setting an image as the main image
  const handleSetMainImage = async (imageUrl: string) => {
    await handleSelectMainImage(imageUrl);
  };
  
  // Handle removing a processed image
  const handleRemoveImage = async (imageUrl: string) => {
    await handleRemoveProcessedImage(imageUrl);
  };
  
  // Open image in lightbox
  const handleImageClick = (imageUrl: string) => {
    if (setLightboxImage) {
      setLightboxImage(imageUrl);
    }
  };
  
  return (
    <div className="space-y-6">
      {isMaxEditsReached && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            הלקוח הגיע למספר העריכות המקסימלי ({maxEdits}). לא ניתן להוסיף תמונות נוספות ללא אישור מנהל.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Add new processed image section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">הוספת תמונה מעוצבת חדשה</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            id="image-url"
            placeholder="הכנס כתובת URL של תמונה"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Button 
            onClick={handleAddImageFromUrl} 
            disabled={isUploading || !imageUrl.trim() || isMaxEditsReached}
          >
            הוסף מ-URL
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading || isMaxEditsReached}
          />
          {isUploading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-primary h-2.5 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Processed images grid */}
      <div>
        <h3 className="text-lg font-medium mb-4">תמונות מעוצבות</h3>
        
        {submission.processed_image_urls && submission.processed_image_urls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submission.processed_image_urls.map((imageUrl) => (
              <div 
                key={imageUrl} 
                className="relative border rounded-md overflow-hidden group"
              >
                <div 
                  className="aspect-video bg-gray-100 cursor-pointer"
                  onClick={() => handleImageClick(imageUrl)}
                >
                  <img 
                    src={imageUrl} 
                    alt="Processed food" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 flex justify-between">
                  <Button
                    variant={imageUrl === submission.main_processed_image_url ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => handleSetMainImage(imageUrl)}
                    className="text-white hover:text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {imageUrl === submission.main_processed_image_url ? 'תמונה ראשית' : 'הגדר כראשית'}
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveImage(imageUrl)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border rounded-md bg-muted/10">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p>אין עדיין תמונות מעוצבות. הוסיפו תמונות כדי להתחיל.</p>
          </div>
        )}
      </div>
      
      {/* Original images section (if available) */}
      {originalImages.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">תמונות מקוריות</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {originalImages.map((imageUrl) => (
              <div 
                key={imageUrl} 
                className="relative border rounded-md overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(imageUrl)}
              >
                <div className="aspect-video bg-gray-100">
                  <img 
                    src={imageUrl} 
                    alt="Original food" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagesTabContent;
