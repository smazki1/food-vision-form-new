/**
 * Image compression utility for optimizing uploads
 * Reduces file size while maintaining good quality for food photography
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export interface CompressionProgress {
  progress: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  maxSizeKB: 500 // 500KB max
};

/**
 * Compress a single image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {},
  onProgress?: (progress: CompressionProgress) => void
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img;
        const maxWidth = opts.maxWidth!;
        const maxHeight = opts.maxHeight!;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // Set canvas size
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx!.drawImage(img, 0, 0, width, height);
        
        // Report initial progress
        if (onProgress) {
          onProgress({
            progress: 50,
            originalSize: file.size,
            compressedSize: 0,
            compressionRatio: 0
          });
        }
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            const compressedFile = new File(
              [blob],
              file.name,
              { type: file.type }
            );
            
            // Report final progress
            if (onProgress) {
              onProgress({
                progress: 100,
                originalSize: file.size,
                compressedSize: compressedFile.size,
                compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100)
              });
            }
            
            resolve(compressedFile);
          },
          file.type,
          opts.quality
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compress multiple images in parallel with progress tracking
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (fileIndex: number, progress: CompressionProgress) => void
): Promise<File[]> => {
  const promises = files.map((file, index) =>
    compressImage(file, options, (progress) => {
      if (onProgress) {
        onProgress(index, progress);
      }
    })
  );
  
  return Promise.all(promises);
};

/**
 * Get formatted size string
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate if file needs compression
 */
export const shouldCompress = (file: File, maxSizeKB: number = 500): boolean => {
  return file.size > maxSizeKB * 1024;
};

/**
 * Batch compress images with concurrency control
 */
export const compressImagesBatch = async (
  files: File[],
  options: CompressionOptions = {},
  concurrency: number = 3,
  onProgress?: (completedCount: number, totalCount: number, currentFile?: string) => void
): Promise<File[]> => {
  const results: File[] = new Array(files.length);
  let completed = 0;
  
  const processFile = async (file: File, index: number): Promise<void> => {
    try {
      const compressed = await compressImage(file, options);
      results[index] = compressed;
      completed++;
      
      if (onProgress) {
        onProgress(completed, files.length, file.name);
      }
    } catch (error) {
      console.warn(`Failed to compress ${file.name}:`, error);
      results[index] = file; // Use original if compression fails
      completed++;
      
      if (onProgress) {
        onProgress(completed, files.length, file.name);
      }
    }
  };
  
  // Process files in batches to control concurrency
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchPromises = batch.map((file, batchIndex) => 
      processFile(file, i + batchIndex)
    );
    
    await Promise.all(batchPromises);
  }
  
  return results;
}; 