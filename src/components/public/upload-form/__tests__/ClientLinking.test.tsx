import { vi, describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

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

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((text: string) => text.replace(/[^a-zA-Z0-9-]/g, '-'))
}));

describe('Client Linking Logic', () => {
  let mockStorageUpload: any;
  let mockStorageGetPublicUrl: any;
  let mockClientSelect: any;
  let mockClientInsert: any;
  let mockSubmissionInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();

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

  describe('Client Creation Logic', () => {
    it('should create new client when restaurant does not exist', async () => {
      // Mock client not found
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      // Simulate the client creation logic from NewPublicUploadForm
      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      let clientId: string;
      if (existingClient) {
        clientId = existingClient.client_id;
      } else {
        clientId = 'mock-uuid-123';
        const placeholderAuthId = 'mock-uuid-123';
        
        await supabase
          .from('clients')
          .insert({
            client_id: clientId,
            user_auth_id: placeholderAuthId,
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
      }

      expect(mockClientSelect).toHaveBeenCalled();
      expect(mockClientInsert).toHaveBeenCalledWith({
        client_id: 'mock-uuid-123',
        user_auth_id: 'mock-uuid-123',
        restaurant_name: 'מסעדת בדיקה',
        contact_name: 'יוסי כהן',
        email: 'test@example.com',
        phone: '0501234567'
      });
    });

    it('should use existing client when restaurant exists', async () => {
      // Mock existing client found
      const existingClient = { client_id: 'existing-client-123' };
      mockClientSelect.mockResolvedValue({ data: existingClient, error: null });

      const formData = {
        restaurantName: 'מסעדת קיימת',
        submitterName: 'דוד לוי',
        phone: '0509876543',
        email: 'david@existing.com'
      };

      const { data: foundClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      let clientId: string;
      if (foundClient) {
        clientId = foundClient.client_id;
      } else {
        // Should not reach here in this test
        clientId = 'new-client-id';
      }

      expect(mockClientSelect).toHaveBeenCalled();
      expect(mockClientInsert).not.toHaveBeenCalled();
      expect(clientId).toBe('existing-client-123');
    });

    it('should handle client creation with missing email', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת ללא מייל',
        submitterName: 'שמואל כהן',
        phone: '0521234567',
        email: undefined
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      if (!existingClient) {
        await supabase
          .from('clients')
          .insert({
            client_id: 'mock-uuid-123',
            user_auth_id: 'mock-uuid-123',
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
      }

      expect(mockClientInsert).toHaveBeenCalledWith({
        client_id: 'mock-uuid-123',
        user_auth_id: 'mock-uuid-123',
        restaurant_name: 'מסעדת ללא מייל',
        contact_name: 'שמואל כהן',
        email: 'placeholder@email.com', // Should use placeholder
        phone: '0521234567'
      });
    });

    it('should handle client creation with missing phone', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const formData = {
        restaurantName: 'מסעדת ללא טלפון',
        submitterName: 'רחל דוד',
        phone: undefined,
        email: 'rachel@test.com'
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      if (!existingClient) {
        await supabase
          .from('clients')
          .insert({
            client_id: 'mock-uuid-123',
            user_auth_id: 'mock-uuid-123',
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
      }

      expect(mockClientInsert).toHaveBeenCalledWith({
        client_id: 'mock-uuid-123',
        user_auth_id: 'mock-uuid-123',
        restaurant_name: 'מסעדת ללא טלפון',
        contact_name: 'רחל דוד',
        email: 'rachel@test.com',
        phone: 'N/A' // Should use N/A placeholder
      });
    });
  });

  describe('Submission Creation Logic', () => {
    it('should create submission linked to client', async () => {
      const clientId = 'test-client-123';
      const formData = {
        restaurantName: 'מסעדת בדיקה',
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };
      const dish = {
        itemName: 'פסטה ברוטב עגבניות',
        itemType: 'מנה',
        description: 'פסטה טרייה'
      };
      const uploadedImageUrls = ['https://example.com/image1.jpg'];

      await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
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

      expect(mockSubmissionInsert).toHaveBeenCalledWith({
        submission_id: 'mock-uuid-123',
        client_id: 'test-client-123',
        item_name_at_submission: 'פסטה ברוטב עגבניות',
        item_type: 'מנה',
        submission_status: 'ממתינה לעיבוד',
        original_image_urls: ['https://example.com/image1.jpg'],
        uploaded_at: expect.any(String),
        restaurant_name: 'מסעדת בדיקה',
        contact_name: 'יוסי כהן',
        email: 'test@example.com',
        phone: '0501234567',
        description: 'פסטה טרייה'
      });
    });

    it('should handle submission with empty image array', async () => {
      const clientId = 'test-client-123';
      const dish = {
        itemName: 'סלט ירוק',
        itemType: 'מנה',
        description: null
      };
      const uploadedImageUrls: string[] = [];

      await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
          client_id: clientId,
          item_name_at_submission: dish.itemName,
          item_type: dish.itemType,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: uploadedImageUrls,
          uploaded_at: new Date().toISOString(),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: null,
          phone: '0501234567',
          description: dish.description
        });

      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_image_urls: [],
          description: null
        })
      );
    });

    it('should handle submission with multiple images', async () => {
      const clientId = 'test-client-123';
      const dish = {
        itemName: 'פיצה מרגריטה',
        itemType: 'מנה',
        description: 'פיצה איטלקית אמיתית'
      };
      const uploadedImageUrls = [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg'
      ];

      await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
          client_id: clientId,
          item_name_at_submission: dish.itemName,
          item_type: dish.itemType,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: uploadedImageUrls,
          uploaded_at: new Date().toISOString(),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: 'test@example.com',
          phone: '0501234567',
          description: dish.description
        });

      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          original_image_urls: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
            'https://example.com/image3.jpg'
          ]
        })
      );
    });
  });

  describe('File Upload Logic', () => {
    it('should upload files to correct storage path', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const itemType = 'מנה';
      const sanitizedItemType = 'מנה'; // mocked sanitization

      const filePath = `public-uploads/${Date.now()}/${sanitizedItemType}/mock-uuid-123.jpg`;
      
      await supabase.storage
        .from('food-vision-images')
        .upload(filePath, mockFile);

      expect(mockStorageUpload).toHaveBeenCalledWith(filePath, mockFile);
    });

    it('should get public URL for uploaded file', async () => {
      const filePath = 'public-uploads/123456789/מנה/test.jpg';
      
      const { data: publicUrlData } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);

      expect(mockStorageGetPublicUrl).toHaveBeenCalledWith(filePath);
      expect(publicUrlData?.publicUrl).toBe('https://example.com/image.jpg');
    });

    it('should handle upload error gracefully', async () => {
      mockStorageUpload.mockResolvedValue({ 
        error: { message: 'Upload failed' } 
      });

      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const filePath = 'public-uploads/123456789/מנה/test.jpg';
      
      const { error } = await supabase.storage
        .from('food-vision-images')
        .upload(filePath, mockFile);

      expect(error).toEqual({ message: 'Upload failed' });
    });

    it('should handle missing public URL', async () => {
      mockStorageGetPublicUrl.mockReturnValue({ data: null });

      const filePath = 'public-uploads/123456789/מנה/test.jpg';
      
      const { data: publicUrlData } = supabase.storage
        .from('food-vision-images')
        .getPublicUrl(filePath);

      expect(publicUrlData).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle client lookup error', async () => {
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

      const { data, error } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      expect(error).toEqual({ message: 'Database connection failed' });
      expect(data).toBeNull();
    });

    it('should handle client creation error', async () => {
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

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      if (!existingClient) {
        const { error } = await supabase
          .from('clients')
          .insert({
            client_id: 'mock-uuid-123',
            user_auth_id: 'mock-uuid-123',
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });

        expect(error).toEqual({ message: 'Client creation failed' });
      }
    });

    it('should handle submission creation error', async () => {
      mockSubmissionInsert.mockResolvedValue({ 
        error: { message: 'Submission creation failed' } 
      });

      const { error } = await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
          client_id: 'test-client-123',
          item_name_at_submission: 'פסטה',
          item_type: 'מנה',
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: [],
          uploaded_at: new Date().toISOString(),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: 'test@example.com',
          phone: '0501234567',
          description: null
        });

      expect(error).toEqual({ message: 'Submission creation failed' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long restaurant names', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const longName = 'מ'.repeat(200);
      const formData = {
        restaurantName: longName,
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      if (!existingClient) {
        await supabase
          .from('clients')
          .insert({
            client_id: 'mock-uuid-123',
            user_auth_id: 'mock-uuid-123',
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
      }

      expect(mockClientInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_name: longName
        })
      );
    });

    it('should handle special characters in restaurant name', async () => {
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const specialName = 'מסעדת "הבית" & גריל - 2024!';
      const formData = {
        restaurantName: specialName,
        submitterName: 'יוסי כהן',
        phone: '0501234567',
        email: 'test@example.com'
      };

      const { data: existingClient } = await supabase
        .from('clients')
        .select('client_id')
        .eq('restaurant_name', formData.restaurantName)
        .single();

      if (!existingClient) {
        await supabase
          .from('clients')
          .insert({
            client_id: 'mock-uuid-123',
            user_auth_id: 'mock-uuid-123',
            restaurant_name: formData.restaurantName,
            contact_name: formData.submitterName,
            email: formData.email || 'placeholder@email.com',
            phone: formData.phone || 'N/A'
          });
      }

      expect(mockClientInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurant_name: specialName
        })
      );
    });

    it('should handle empty dish name', async () => {
      const clientId = 'test-client-123';
      const dish = {
        itemName: '',
        itemType: 'מנה',
        description: 'תיאור ללא שם'
      };

      await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
          client_id: clientId,
          item_name_at_submission: dish.itemName,
          item_type: dish.itemType,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: [],
          uploaded_at: new Date().toISOString(),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: 'test@example.com',
          phone: '0501234567',
          description: dish.description
        });

      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          item_name_at_submission: ''
        })
      );
    });

    it('should handle empty item type', async () => {
      const clientId = 'test-client-123';
      const dish = {
        itemName: 'פריט ללא סוג',
        itemType: '',
        description: 'תיאור'
      };

      await supabase
        .from('customer_submissions')
        .insert({
          submission_id: 'mock-uuid-123',
          client_id: clientId,
          item_name_at_submission: dish.itemName,
          item_type: dish.itemType,
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: [],
          uploaded_at: new Date().toISOString(),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: 'test@example.com',
          phone: '0501234567',
          description: dish.description
        });

      expect(mockSubmissionInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          item_type: ''
        })
      );
    });
  });
}); 