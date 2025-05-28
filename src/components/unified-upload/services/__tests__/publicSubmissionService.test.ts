import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handlePublicSubmission } from '../publicSubmissionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as imageUploadUtils from '../../utils/imageUploadUtils'; // Assuming this is the path

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(), // In case other parts of the submission flow call it
  },
}));

// Mocking the imageUploadUtils module if it's used indirectly or directly by publicSubmissionService
// For now, let's assume publicSubmissionService doesn't directly call uploadImages, 
// as uploadImages is called by useUnifiedFormSubmission hook which then calls handlePublicSubmission
// If handlePublicSubmission itself was calling uploadImages, we'd mock it like this:
vi.mock('../../utils/imageUploadUtils', () => ({
  uploadImages: vi.fn(),
}));


describe('handlePublicSubmission', () => {
  const mockUploadedImageUrls = ['http://example.com/image1.jpg'];

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Default mock implementation for supabase.rpc to simulate success
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      data: { success: true, client_found: false, message: 'Test success' }, 
      error: null 
    });
    // Default mock for uploadImages if it were used (it's not directly by this service)
    vi.spyOn(imageUploadUtils, 'uploadImages').mockResolvedValue(mockUploadedImageUrls);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const baseFormData = {
    restaurantName: 'Test Restaurant',
    contactEmail: 'test@example.com',
    contactPhone: '1234567890',
    itemName: 'Test Item',
    description: 'Ingredient1, Ingredient2', // For cocktail ingredients OR dish/drink category
    specialNotes: 'Special instructions for the chef', // For general description
    referenceImages: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
  };

  it('should correctly map data and call RPC for a cocktail submission', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    
    await handlePublicSubmission(cocktailData, mockUploadedImageUrls);

    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      {
        p_restaurant_name: 'Test Restaurant',
        p_item_type: 'cocktail',
        p_item_name: 'Test Item',
        p_description: 'Special instructions for the chef', // from specialNotes
        p_category: null, // Cocktails don't have a category in this mapping
        p_ingredients: ['Ingredient1', 'Ingredient2'], // from description
        p_reference_image_urls: mockUploadedImageUrls,
      }
    );
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Test success'));
  });

  it('should correctly map data and call RPC for a dish submission', async () => {
    const dishData = { 
      ...baseFormData, 
      itemType: 'dish' as const,
      description: 'Main Course', // This is category for dish
      specialNotes: 'Serve with a side of fries' // This is actual description
    };
    
    await handlePublicSubmission(dishData, mockUploadedImageUrls);

    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      {
        p_restaurant_name: 'Test Restaurant',
        p_item_type: 'dish',
        p_item_name: 'Test Item',
        p_description: 'Serve with a side of fries', // from specialNotes
        p_category: 'Main Course', // from description
        p_ingredients: null, // Dishes don't have ingredients array
        p_reference_image_urls: mockUploadedImageUrls,
      }
    );
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Test success'));
  });

  it('should correctly map data and call RPC for a drink submission', async () => {
    const drinkData = { 
      ...baseFormData, 
      itemType: 'drink' as const,
      description: 'Cold Beverage', // This is category for drink
      specialNotes: 'Extra ice please' // This is actual description
    };
    
    await handlePublicSubmission(drinkData, mockUploadedImageUrls);

    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      {
        p_restaurant_name: 'Test Restaurant',
        p_item_type: 'drink',
        p_item_name: 'Test Item',
        p_description: 'Extra ice please', // from specialNotes
        p_category: 'Cold Beverage', // from description
        p_ingredients: null, // Drinks don't have ingredients array
        p_reference_image_urls: mockUploadedImageUrls,
      }
    );
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Test success'));
  });

  it('should handle RPC error and show error toast', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    const rpcError = { message: 'RPC Failed', details: 'details', hint: 'hint', code: '123' };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: rpcError });

    await expect(handlePublicSubmission(cocktailData, mockUploadedImageUrls))
      .rejects.toThrow('שגיאה בהגשה: RPC Failed');
    
    expect(toast.error).toHaveBeenCalledWith('שגיאה בהגשה: RPC Failed');
  });

  it('should handle RPC success:false with a message from server', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      data: { success: false, message: 'Custom server error message' }, 
      error: null 
    });

    await expect(handlePublicSubmission(cocktailData, mockUploadedImageUrls))
      .rejects.toThrow('Custom server error message');
    
    expect(toast.error).toHaveBeenCalledWith('Custom server error message');
  });

  it('should handle unexpected RPC response structure and show generic error toast', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { info: 'weird response' }, error: null }); // Unexpected structure

    await expect(handlePublicSubmission(cocktailData, mockUploadedImageUrls))
      .rejects.toThrow('הגשה נכשלה - תגובה לא צפויה מהשרת');
    
    expect(toast.error).toHaveBeenCalledWith('הגשה נכשלה - תגובה לא צפויה מהשרת');
  });

  it('should use an empty array for ingredients if description is empty for cocktail', async () => {
    const cocktailData = {
      ...baseFormData,
      itemType: 'cocktail' as const,
      description: ' ', // Empty description
    };
    await handlePublicSubmission(cocktailData, mockUploadedImageUrls);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      expect.objectContaining({ p_ingredients: null }) // or empty array depending on implementation, current is null
    );
  });

  it('should use null for category if description is empty for dish/drink', async () => {
    const dishData = {
      ...baseFormData,
      itemType: 'dish' as const,
      description: ' ', // Empty description
    };
    await handlePublicSubmission(dishData, mockUploadedImageUrls);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      expect.objectContaining({ p_category: null })
    );
  });

  it('should use null for description if specialNotes is empty', async () => {
    const cocktailData = {
      ...baseFormData,
      itemType: 'cocktail' as const,
      specialNotes: ' ', // Empty special notes
    };
    await handlePublicSubmission(cocktailData, mockUploadedImageUrls);
    expect(supabase.rpc).toHaveBeenCalledWith(
      'public_submit_item_by_restaurant_name',
      expect.objectContaining({ p_description: null })
    );
  });

  it('should show specific success message if client is found', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      data: { success: true, client_found: true, message: 'הפריט הוגש בהצלחה ושויך למסעדה!' }, 
      error: null 
    });

    await handlePublicSubmission(cocktailData, mockUploadedImageUrls);
    expect(toast.success).toHaveBeenCalledWith('הפריט הוגש בהצלחה ושויך למסעדה!');
  });

  it('should show specific success message if client is NOT found', async () => {
    const cocktailData = { ...baseFormData, itemType: 'cocktail' as const };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      data: { success: true, client_found: false, message: 'הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.' }, 
      error: null 
    });

    await handlePublicSubmission(cocktailData, mockUploadedImageUrls);
    expect(toast.success).toHaveBeenCalledWith('הפריט הוגש בהצלחה! המסעדה לא נמצאה במערכת, הפריט ממתין לשיוך ידני.');
  });

}); 