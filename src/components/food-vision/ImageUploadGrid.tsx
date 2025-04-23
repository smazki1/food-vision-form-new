
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, X } from "lucide-react";

interface ImageUploadGridProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizeInMb?: number;
}

export const ImageUploadGrid: React.FC<ImageUploadGridProps> = ({
  images,
  onImagesChange,
  maxImages = 4,
  maxSizeInMb = 5,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > maxSizeInMb * 1024 * 1024) {
        alert(`הקובץ ${file.name} גדול מ-${maxSizeInMb}MB`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxImages) {
      alert(`ניתן להעלות עד ${maxImages} תמונות`);
      return;
    }

    onImagesChange([...images, ...validFiles]);
    e.target.value = ""; // Reset input
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  // New: Guidance block for users (Hebrew, stylized, mobile-friendly)
  const guidance = (
    <div className="mb-3 p-3 rounded-md border bg-[#fff3da] text-[#ff8b1d] text-sm sm:text-base font-medium leading-relaxed shadow-sm">
      <strong className="block text-[#c94d0a] font-bold text-base mb-1">הנחיות להעלאת תמונות:</strong>
      <ul className="list-disc pr-4 space-y-0.5 text-xs sm:text-base">
        <li>ניתן להעלות עד 4 תמונות לכל מנה.</li>
        <li>מומלץ לצלם באור טבעי, מזווית שמחמיאה למנה (מבט מלמעלה או בזווית 45°).</li>
        <li>אנא ודאו שהתמונה ברורה – אם יש רקע רועש, שימו את המנה על רקע חלק או מפה <span role="img" aria-label="smile">😊</span></li>
        <li>פורמטים נתמכים: JPG, PNG</li>
        <li>משקל מקסימלי לתמונה: 5MB</li>
      </ul>
    </div>
  );

  return (
    <div className="space-y-4">
      {guidance}
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/jpeg,image/png"
          multiple
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={images.length >= maxImages}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("image-upload")?.click()}
          disabled={images.length >= maxImages}
        >
          <ImageIcon className="h-4 w-4 ml-2" />
          {images.length > 0 ? "הוסף תמונה" : "העלה תמונות"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {images.length} / {maxImages} תמונות
        </span>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={`תמונה ${index + 1}`}
                className="w-[100px] h-[100px] object-cover rounded-md"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
