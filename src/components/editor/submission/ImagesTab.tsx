
import React, { useRef, useState } from "react";
import { ImageIcon, Upload, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FilePreviewGrid } from "@/components/food-vision/FilePreviewGrid";
import { Separator } from "@/components/ui/separator";
import { uploadFileToStorage } from "@/utils/storage-utils";

interface ImagesTabProps {
  submission: any;
  handleSelectMainImage: (imageUrl: string) => void;
  handleRemoveProcessedImage: (imageUrl: string) => void;
  addProcessedImage: (url: string) => Promise<boolean>;
  setLightboxImage: (imageUrl: string) => void;
}

const ImagesTab: React.FC<ImagesTabProps> = ({ 
  submission,
  handleSelectMainImage,
  handleRemoveProcessedImage,
  addProcessedImage,
  setLightboxImage
}) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...filesArray]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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
      
      setImageFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error uploading images:", err);
    } finally {
      setUploadingImages(false);
    }
  };

  const imagePreviewSection = (url: string, index: number) => (
    <div key={index} className="relative group">
      <img
        src={url}
        alt={`תמונה מעובדת ${index + 1}`}
        className={`aspect-square object-cover rounded-md border cursor-pointer
          ${url === submission.main_processed_image_url ? 'border-2 border-primary' : 'border-gray-200'}`}
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
          variant="default"
        >
          ראשית
        </Badge>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
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
              submission.processed_image_urls.map((url: string, idx: number) => (
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
          <p className="text-muted-foreground">אין תמונות מעובדות לבדיקה</p>
        )}
      </div>
    </div>
  );
};

export default ImagesTab;
