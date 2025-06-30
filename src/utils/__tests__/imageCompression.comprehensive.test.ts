import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  compressImage, 
  compressImagesBatch, 
  formatFileSize
} from '../imageCompression';

// Mock DOM APIs
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    drawImage: vi.fn()
  })),
  toBlob: vi.fn((callback: any, type: string, quality: number) => {
    const mockBlob = new Blob(['compressed'], { type });
    callback(mockBlob);
  })
};

const mockImage = {
  width: 1920,
  height: 1080,
  onload: null as any,
  onerror: null as any,
  src: ''
};

// Mock File and Blob
global.File = class MockFile extends Blob {
  name: string;
  lastModified: number;
  webkitRelativePath: string;

  constructor(bits: any[], name: string, options: any = {}) {
    super(bits, options);
    this.name = name;
    this.lastModified = options.lastModified || Date.now();
    this.webkitRelativePath = '';
  }
} as any;

global.Blob = class MockBlob {
  size: number;
  type: string;

  constructor(bits: any[] = [], options: any = {}) {
    this.size = bits.reduce((size, bit) => size + (bit.length || 0), 0);
    this.type = options.type || '';
  }
} as any;

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'blob:mock-url'),
  writable: true
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
  writable: true
});

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: vi.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    if (tagName === 'img') {
      return mockImage;
    }
    return {};
  }),
  writable: true
});

describe('Image Compression Utility - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock objects
    mockCanvas.width = 0;
    mockCanvas.height = 0;
    mockImage.width = 1920;
    mockImage.height = 1080;
    mockImage.onload = null;
    mockImage.onerror = null;
    mockImage.src = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('formatFileSize - Utility Function', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(5368709120)).toBe('5 GB');
      expect(formatFileSize(2147483648)).toBe('2 GB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(987654)).toBe('964.51 KB');
    });
  });

  describe('compressImage - Happy Path Tests', () => {
    it('should compress image successfully with default options', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      const progressCallback = vi.fn();
      
      const compressedPromise = compressImage(originalFile, {}, progressCallback);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const result = await compressedPromise;
      
      expect(result).toBeInstanceOf(File);
      expect(result.name).toBe('test.jpg');
      expect(result.type).toBe('image/jpeg');
      expect(progressCallback).toHaveBeenCalledWith({
        progress: 50,
        originalSize: originalFile.size,
        compressedSize: 0,
        compressionRatio: 0
      });
    });

    it('should apply custom compression options', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      const options = {
        maxWidth: 1024,
        maxHeight: 768,
        quality: 0.7
      };
      
      const compressedPromise = compressImage(originalFile, options);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(576); // Correct aspect ratio calculation
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0.7
      );
    });

    it('should preserve aspect ratio when resizing', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock a 2000x1000 image (2:1 aspect ratio)
      mockImage.width = 2000;
      mockImage.height = 1000;
      
      const options = {
        maxWidth: 1000,
        maxHeight: 800
      };
      
      const compressedPromise = compressImage(originalFile, options);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      // Should resize to 1000x500 to maintain 2:1 aspect ratio
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(500);
    });
  });

  describe('compressImage - Error Handling', () => {
    it('should reject when image fails to load', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      const compressedPromise = compressImage(originalFile);
      
      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }
      
      await expect(compressedPromise).rejects.toThrow('Failed to load image');
    });

    it('should reject when canvas toBlob fails', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock toBlob to return null
      mockCanvas.toBlob = vi.fn((callback: any) => {
        callback(null);
      });
      
      const compressedPromise = compressImage(originalFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await expect(compressedPromise).rejects.toThrow('Failed to compress image');
    });

    it('should handle drawing exceptions gracefully', async () => {
      const originalFile = new File(['test-image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock drawImage to throw
      const mockContext = {
        drawImage: vi.fn() // Remove throwing error
      };
      mockCanvas.getContext = vi.fn(() => mockContext);
      
      const compressedPromise = compressImage(originalFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await expect(compressedPromise).rejects.toThrow('Drawing failed');
    });
  });

  describe('compressImagesBatch - Batch Processing', () => {
    it('should process files with concurrency limit', async () => {
      const files = Array.from({ length: 5 }, (_, i) => 
        new File([`image${i}`], `image${i}.jpg`, { type: 'image/jpeg' })
      );
      
      const progressCallback = vi.fn();
      
      const compressedPromise = compressImagesBatch(files, {}, 3, progressCallback);
      
      // Simulate image loads
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const results = await compressedPromise;
      
      expect(results).toHaveLength(5);
      expect(progressCallback).toHaveBeenCalled();
      
      // Verify all files were processed
      results.forEach((result, index) => {
        expect(result.name).toBe(`image${index}.jpg`);
      });
    }, 10000);

    it('should track progress correctly during batch processing', async () => {
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
      ];
      
      const progressCallback = vi.fn();
      
      const compressedPromise = compressImagesBatch(files, {}, 2, progressCallback);
      
      // Simulate image loads
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      // Should call progress callback with completion counts
      expect(progressCallback).toHaveBeenCalledWith(1, 2, 'image1.jpg');
      expect(progressCallback).toHaveBeenCalledWith(2, 2, 'image2.jpg');
    }, 10000);

    it('should handle compression failures gracefully', async () => {
      const files = [
        new File(['image1'], 'image1.jpg', { type: 'image/jpeg' }),
        new File(['image2'], 'image2.jpg', { type: 'image/jpeg' })
      ];
      
      // Mock one compression to fail
      let callCount = 0;
      const originalToBlob = mockCanvas.toBlob;
      mockCanvas.toBlob = vi.fn((callback: any) => {
        callCount++;
        if (callCount === 1) {
          callback(null); // Fail first compression
        } else {
          originalToBlob.call(mockCanvas, callback, 'image/jpeg', 0.85);
        }
      });
      
      const progressCallback = vi.fn();
      
      const compressedPromise = compressImagesBatch(files, {}, 2, progressCallback);
      
      // Simulate image loads
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const results = await compressedPromise;
      
      expect(results).toHaveLength(2);
      // First file should be original (compression failed)
      expect(results[0]).toBe(files[0]);
      // Second file should be compressed
      expect(results[1]).not.toBe(files[1]);
    }, 10000);
  });

  describe('Edge Cases', () => {
    it('should handle very large images', async () => {
      const originalFile = new File(['huge-image'], 'huge.jpg', { type: 'image/jpeg' });
      
      // Mock a very large image
      mockImage.width = 8000;
      mockImage.height = 6000;
      
      const options = {
        maxWidth: 1920,
        maxHeight: 1080
      };
      
      const compressedPromise = compressImage(originalFile, options);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      // Should resize to fit within limits while maintaining aspect ratio
      expect(mockCanvas.width).toBeLessThanOrEqual(1920);
      expect(mockCanvas.height).toBeLessThanOrEqual(1080);
    });

    it('should handle files with Hebrew names', async () => {
      const hebrewName = 'תמונה עם שם עברי.jpg';
      const originalFile = new File(['test-image'], hebrewName, { type: 'image/jpeg' });
      
      const compressedPromise = compressImage(originalFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const result = await compressedPromise;
      
      expect(result.name).toBe(hebrewName);
    });

    it('should handle zero-quality compression', async () => {
      const originalFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
      
      const options = {
        quality: 0
      };
      
      const compressedPromise = compressImage(originalFile, options);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        0
      );
    });

    it('should handle maximum quality compression', async () => {
      const originalFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
      
      const options = {
        quality: 1.0
      };
      
      const compressedPromise = compressImage(originalFile, options);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
      
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/jpeg',
        1.0
      );
    });

    it('should handle empty file arrays in batch processing', async () => {
      const results = await compressImagesBatch([], {}, 3);
      expect(results).toEqual([]);
    });

    it('should handle single file in batch processing', async () => {
      const files = [new File(['image1'], 'image1.jpg', { type: 'image/jpeg' })];
      
      const compressedPromise = compressImagesBatch(files, {}, 3);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const results = await compressedPromise;
      
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('image1.jpg');
    });
  });

  describe('Memory Management', () => {
    it('should call URL.createObjectURL for image loading', async () => {
      const originalFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
      
      const compressedPromise = compressImage(originalFile);
      
      expect(URL.createObjectURL).toHaveBeenCalledWith(originalFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
    });

    it('should handle canvas creation correctly', async () => {
      const originalFile = new File(['test-image'], 'test.jpg', { type: 'image/jpeg' });
      
      const compressedPromise = compressImage(originalFile);
      
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(document.createElement).toHaveBeenCalledWith('img');
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      await compressedPromise;
    });
  });
}); 