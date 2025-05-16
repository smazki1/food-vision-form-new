
import React, { useRef, useState } from "react";
import { ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePreviewGrid } from "@/components/food-vision/FilePreviewGrid";
import { uploadFileToStorage } from "@/utils/storage-utils";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => Promise<boolean>;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded }) => {
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
          await onImageUploaded(url);
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

  return (
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
  );
};

export default ImageUploader;
