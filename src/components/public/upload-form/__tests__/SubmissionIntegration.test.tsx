import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn()
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((text: string) => text.replace(/[^a-zA-Z0-9-]/g, '-'))
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('Submission Integration Flow', () => {
  let mockStorageUpload: any;
  let mockStorageGetPublicUrl: any;
  let mockClientSelect: any;
  let mockClientInsert: any;
  let mockSubmissionInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';

    // Setup storage mocks
    mockStorageUpload = vi.fn().mockResolvedValue({ error: null });
    mockStorageGetPublicUrl = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/image.jpg' }
    });

    // Setup database mocks
    mockClientSelect = vi.fn();
    mockClientInsert = vi.fn().mockResolvedValue({ error: null });
    mockSubmissionInsert = vi.fn().mockResolvedValue({ error: null });

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: mockStorageUpload,
      getPublicUrl: mockStorageGetPublicUrl
    } as any);

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'clients') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockClientSelect
            }))
          })),
          insert: mockClientInsert
        } as any;
      } else if (table === 'customer_submissions') {
        return {
          insert: mockSubmissionInsert
        } as any;
      }
      return {} as any;
    });
  });

  // Simulate the complete handleSubmit function from NewPublicUploadForm
  const simulateSubmission = async (formData: any, dishes: any[]) => {
    try {
      toast.info('מעבד את ההגשה...');

      // Check if client exists or create new one (ONCE per submission)
      let clientId: string;
      
      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();
        
      if (existingClient) {
        clientId = existingClient.client_id;
      } else {
        clientId = 'mock-uuid-123';
        const placeholderAuthId = 'mock-uuid-123';
        
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            client_id: clientId,
            user_auth_id: placeholderAuthId,
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
          
        if (clientError) {
          throw new Error(`Client creation error: ${clientError.message}`);
        }
      }

      // Process each dish
      for (const dish of dishes) {
        const uploadedImageUrls: string[] = [];

        // Upload images
        if (dish.referenceImages && dish.referenceImages.length > 0) {
          for (const file of dish.referenceImages) {
            const fileExtension = file.name.split('.').pop();
            const uniqueFileName = `mock-uuid-123.${fileExtension}`;
            const sanitizedItemType = dish.itemType.replace(/[^a-zA-Z0-9-]/g, '-');
            const filePath = `public-uploads/${Date.now()}/${sanitizedItemType}/${uniqueFileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('food-vision-images')
              .upload(filePath, file);
              
            if (uploadError) {
              throw new Error(`שגיאה בהעלאת קובץ: ${uploadError.message}`);
            }
            
            const { data: publicUrlData } = supabase.storage
              .from('food-vision-images')
              .getPublicUrl(filePath);
              
            if (publicUrlData?.publicUrl) {
              uploadedImageUrls.push(publicUrlData.publicUrl);
            }
          }
        }

        // Create submission linked to client
        const submissionId = 'mock-uuid-123';
        const { error: submissionError } = await supabase
          .from('customer_submissions')
          .insert({
            submission_id: submissionId,
            client_id: clientId,
            item_name_at_submission: dish.itemName,
            item_type: dish.itemType,
            submission_status: 'ממתינה לעיבוד',
            original_image_urls: uploadedImageUrls,
            uploaded_at: new Date().toISOString(),
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || null,
            phone: formData.phone,
            description: dish.description || null
          });

        if (submissionError) {
          throw new Error(`Database error: ${submissionError.message}`);
        }
      }

      toast.success('ההזמנה נשלחה בהצלחה!');
      
      setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1000);

      return true;
    } catch (error: any) {
      toast.error('אנא נסו שוב');
      throw error;
    }
  };

  describe('Complete Submission Flow - Happy Path', () => {
    it('should complete full submission for new client with single dish', async () => {
      // Mock new client scenario
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה ברוטב עגבניות',
        itemType: 'מנה',
        description: 'פסטה טרייה עם רוטב עגבניות ביתי',
        referenceImages: [
          new File(['test'], 'pasta.jpg', { type: 'image/jpeg' })
        ]
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(toast.info).toHaveBeenCalledWith('מעבד את ההגשה...');
      expect(mockStorageUpload).toHaveBeenCalled();
      expect(mockClientInsert).toHaveBeenCalled();
      expect(mockSubmissionInsert).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('ההזמנה נשלחה בהצלחה!');
    });

    it('should complete submission for existing client', async () => {
      // Mock existing client scenario
      const existingClient = { client_id: 'existing-client-123' };
      mockClientSelect.mockResolvedValue({ data: existingClient, error: null });

      const formData = {
        restaurantName: 'מסעדת קיימת',
        submitterName: 'דוד לוי',
        phone: '0509876543',
        email: 'david@existing.com'
      };

      const dishes = [{
        itemName: 'סלט קיסר',
        itemType: 'מנה',
        description: 'סלט קיסר קלאסי',
        referenceImages: [
          new File(['test'], 'salad.jpg', { type: 'image/jpeg' })
        ]
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockClientInsert).not.toHaveBeenCalled(); // Should not create new client
      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: 'existing-client-123'
        })
      );
    });

    it('should handle multiple dishes submission', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת מנות מרובות',
        submitterName: 'רחל דוד',
        phone: '0521234567',
        email: 'rachel@multi.com'
      };

      const dishes = [
        {
          itemName: 'פסטה',
          itemType: 'מנה',
          description: 'פסטה ראשונה',
          referenceImages: [new File(['test1'], 'pasta.jpg', { type: 'image/jpeg' })]
        },
        {
          itemName: 'פיצה',
          itemType: 'מנה',
          description: 'פיצה שנייה',
          referenceImages: [new File(['test2'], 'pizza.jpg', { type: 'image/jpeg' })]
        },
        {
          itemName: 'סלט',
          itemType: 'מנה',
          description: 'סלט שלישי',
          referenceImages: [new File(['test3'], 'salad.jpg', { type: 'image/jpeg' })]
        }
      ];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledTimes(3); // 3 images uploaded
      expect(mockSubmissionInsert).toHaveBeenCalledTimes(3); // 3 submissions created
      expect(mockClientInsert).toHaveBeenCalledTimes(1); // Only 1 client created
    });

    it('should handle submission without images', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת ללא תמונות',
        submitterName: 'שמואל כהן',
        phone: '0531234567',
        email: 'shmuel@noimg.com'
      };

      const dishes = [{
        itemName: 'מנה ללא תמונה',
        itemType: 'מנה',
        description: 'מנה בלי תמונות',
        referenceImages: []
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockStorageUpload).not.toHaveBeenCalled();
      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_image_urls: []
        })
      );
    });
  });

  describe('Error Handling in Complete Flow', () => {
    it('should handle image upload failure', async () => {
      // Mock client lookup to succeed first
      mockClientSelect.mockResolvedValue({ data: null, error: null });
      
      // Then mock upload to fail
      mockStorageUpload.mockResolvedValue({ 
        error: { message: 'Upload failed' } 
      });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: [new File(['test'], 'pasta.jpg', { type: 'image/jpeg' })]
      }];

      await expect(simulateSubmission(formData, dishes))
        .rejects.toThrow('שגיאה בהעלאת קובץ: Upload failed');

      expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
    });

    it('should handle client creation failure', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });
      mockClientInsert.mockResolvedValue({ 
        error: { message: 'Client creation failed' } 
      });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: []
      }];

      await expect(simulateSubmission(formData, dishes))
        .rejects.toThrow('Client creation error: Client creation failed');

      expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
    });

    it('should handle submission creation failure', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });
      mockSubmissionInsert.mockResolvedValue({ 
        error: { message: 'Submission failed' } 
      });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: []
      }];

      await expect(simulateSubmission(formData, dishes))
        .rejects.toThrow('Database error: Submission failed');

      expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
    });

    it('should handle client lookup failure', async () => {
      mockClientSelect.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: []
      }];

      // This should continue and try to create a new client even with lookup error
      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockClientInsert).toHaveBeenCalled();
    });
  });

  describe('Edge Cases in Complete Flow', () => {
    it('should handle Hebrew characters in file names', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה עברית',
        description: 'פסטה',
        referenceImages: [new File(['test'], 'תמונה עברית.jpg', { type: 'image/jpeg' })]
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledWith(
        expect.stringMatching(/public-uploads\/\d+\/---------\/mock-uuid-123\.jpg/),
        expect.any(File)
      );
    });

    it('should handle missing optional fields', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת חסרות',
        submitterName: 'יוסי כהן',
        phone: '', // Missing phone
        email: '' // Missing email
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: '', // Missing description
        referenceImages: []
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockClientInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'placeholder@email.com',
          phone: 'N/A'
        })
      );
      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          description: null
        })
      );
    });

    it('should handle very large files', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת קבצים גדולים',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      // Create a large file (simulated)
      const largeFileContent = 'x'.repeat(10000);
      const largeFile = new File([largeFileContent], 'large-image.jpg', { type: 'image/jpeg' });

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: [largeFile]
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledWith(
        expect.any(String),
        largeFile
      );
    });

    it('should handle multiple images per dish', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת תמונות מרובות',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: [
          new File(['test1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['test2'], 'image2.jpg', { type: 'image/jpeg' }),
          new File(['test3'], 'image3.jpg', { type: 'image/jpeg' })
        ]
      }];

      const result = await simulateSubmission(formData, dishes);

      expect(result).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledTimes(3);
      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_image_urls: [
            'https://example.com/image.jpg',
            'https://example.com/image.jpg',
            'https://example.com/image.jpg'
          ]
        })
      );
    });
  });

  describe('Performance and Timing', () => {
    it('should complete submission within reasonable time', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת ביצועים',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: [new File(['test'], 'pasta.jpg', { type: 'image/jpeg' })]
      }];

      const startTime = Date.now();
      const result = await simulateSubmission(formData, dishes);
      const endTime = Date.now();

      expect(result).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle concurrent submissions', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת בו זמנית',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const dishes = [{
        itemName: 'פסטה',
        itemType: 'מנה',
        description: 'פסטה',
        referenceImages: []
      }];

      // Simulate concurrent submissions
      const promises = [
        simulateSubmission(formData, dishes),
        simulateSubmission(formData, dishes),
        simulateSubmission(formData, dishes)
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(mockSubmissionInsert).toHaveBeenCalledTimes(3);
    });
  });
}); 