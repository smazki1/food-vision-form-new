
import React from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilePreviewGridProps {
  files: File[];
  onRemove: (index: number) => void;
  size?: number;
}

export const FilePreviewGrid: React.FC<FilePreviewGridProps> = ({
  files,
  onRemove,
  size = 100,
}) => {
  // Safety check: ensure files is an array and filter out any invalid items
  const safeFiles = Array.isArray(files) ? files.filter(file => 
    file && typeof file === 'object' && file instanceof File
  ) : [];
  
  if (!safeFiles.length) return null;

  return (
    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
      {safeFiles.map((file, idx) => (
        <div key={idx} className="relative group">
          <img
            src={URL.createObjectURL(file)}
            alt={`preview-${idx}`}
            className="object-cover rounded-md"
            style={{ width: size, height: size }}
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 opacity-80 group-hover:opacity-100"
            onClick={() => onRemove(idx)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};
