/// <reference types="vitest/globals" />
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { submissionsAPI } from '../submissionsAPI';

// Mock File constructor
global.File = class MockFile {
  private parts: (string | Blob | MockFile)[];
  private name: string;
  type: string;
  lastModified: number;

  constructor(parts: (string | Blob | MockFile)[], name: string, options?: FilePropertyBag) {
    this.parts = parts;
    this.name = name;
    this.type = options?.type || '';
    this.lastModified = options?.lastModified || Date.now();
  }

  // Add other methods and properties as needed by your tests
  // For example, arrayBuffer, slice, stream, text
  get size(): number {
    return this.parts.reduce((acc, part) => {
      if (typeof part === 'string') return acc + part.length;
      // For Blob or other MockFile, you'd need a more complex size calculation
      return acc;
    }, 0);
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    throw new Error('Method not implemented.');
  }
  slice(): Blob {
    throw new Error('Method not implemented.');
  }
  stream() {
    throw new Error('Method not implemented.');
  }
  text(): Promise<string> {
    throw new Error('Method not implemented.');
  }
} as any;


vi.mock('@/integrations/supabase/client', async () => {
  const actualVitest = await vi.importActual<typeof import('vitest')>('vitest');
  const { vi: actualVi } = actualVitest;

  const uploadFn = actualVi.fn();
  const getPublicUrlFn = actualVi.fn();
  const storageFromFn = actualVi.fn(() => ({
    upload: uploadFn,
    getPublicUrl: getPublicUrlFn,
  }));
  
  const rpcFn = actualVi.fn();

  return {
    supabase: {
      storage: {
        from: storageFromFn,
      },
      rpc: rpcFn,
      _internalMocks: {
        storageFrom: storageFromFn,
        upload: uploadFn,
        getPublicUrl: getPublicUrlFn,
        rpc: rpcFn,
      }
    },
  };
});

import { supabase } from '@/integrations/supabase/client';

let storageFromMock: any;
let uploadMock: any;
let getPublicUrlMock: any;
let rpcMock: any;

describe('submissionsAPI', () => {
  beforeEach(() => {
    const internalMocks = (supabase as any)._internalMocks || {};
    storageFromMock = internalMocks.storageFrom;
    uploadMock = internalMocks.upload;
    getPublicUrlMock = internalMocks.getPublicUrl;
    rpcMock = internalMocks.rpc;

    vi.clearAllMocks();
    vi.useFakeTimers(); // For Date.now() in fileName generation

    // Default mocks
    uploadMock.mockResolvedValue({ data: { path: 'test-path.jpg' }, error: null });
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: 'http://supabase.io/test-path.jpg' } });
    rpcMock.mockResolvedValue({ data: 'submission-id-123', error: null });
    storageFromMock.mockReturnValue({ // Ensure storage.from() returns the object with upload and getPublicUrl
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockFile = (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    return new File([new Array(size).join('a')], name, { type });
  };

  const basicFormData = {
    restaurantName: 'Test Restaurant',
    contactName: 'Test Contact',
    phone: '1234567890',
    email: 'test@example.com',
    itemType: 'dish' as 'dish' | 'cocktail' | 'drink',
    itemName: 'Test Item',
    description: 'Test Description',
  };

  describe('submitPublicForm', () => {
    test('should successfully upload images and submit data, returning submission ID', async () => {
      const files = [createMockFile('file1.jpg'), createMockFile('file2.png')];
      const formData = { ...basicFormData, images: files };
      const expectedSubmissionId = 'submission-id-123';
      rpcMock.mockResolvedValueOnce({ data: expectedSubmissionId, error: null });

      const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(1670000000000); 
      // We don't need to mock Math.random() if we are not checking the exact random string

      const result = await submissionsAPI.submitPublicForm(formData);

      expect(storageFromMock).toHaveBeenCalledWith('uploads');
      expect(uploadMock).toHaveBeenCalledTimes(files.length);
      // Use stringContaining for the date part and stringMatching for the extension
      expect(uploadMock).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('public-submissions/1670000000000-'), 
        files[0]
      );
      expect(uploadMock.mock.calls[0][0]).toMatch(/\.jpg$/);

      expect(uploadMock).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('public-submissions/1670000000000-'), 
        files[1]
      );
      expect(uploadMock.mock.calls[1][0]).toMatch(/\.png$/);
      
      expect(getPublicUrlMock).toHaveBeenCalledTimes(files.length);
      expect(getPublicUrlMock).toHaveBeenNthCalledWith(1, expect.stringContaining('public-submissions/1670000000000-'));
      expect(getPublicUrlMock.mock.calls[0][0]).toMatch(/\.jpg$/);
      expect(getPublicUrlMock).toHaveBeenNthCalledWith(2, expect.stringContaining('public-submissions/1670000000000-'));
      expect(getPublicUrlMock.mock.calls[1][0]).toMatch(/\.png$/);

      expect(rpcMock).toHaveBeenCalledWith('public_submit_item_by_restaurant_name', {
        p_restaurant_name: formData.restaurantName,
        p_contact_name: formData.contactName,
        p_phone: formData.phone,
        p_email: formData.email,
        p_item_type: formData.itemType,
        p_item_name: formData.itemName,
        p_description: formData.description,
        p_special_notes: '', // default
        p_category: '', // default
        p_image_urls: JSON.stringify([
          'http://supabase.io/test-path.jpg', // Corresponds to the mocked getPublicUrl return
          'http://supabase.io/test-path.jpg'  // Corresponds to the mocked getPublicUrl return
        ])
      });
      expect(result).toEqual({ success: true, submissionId: expectedSubmissionId });

      dateNowSpy.mockRestore();
      // mathRandomSpy.mockRestore(); // No longer needed
    });

    test('should handle optional fields: specialNotes and category', async () => {
      const files = [createMockFile('file1.jpg')];
      const formData = { 
        ...basicFormData, 
        images: files, 
        specialNotes: 'Extra spicy', 
        category: 'Main Course' 
      };
      
      await submissionsAPI.submitPublicForm(formData);

      expect(rpcMock).toHaveBeenCalledWith('public_submit_item_by_restaurant_name', expect.objectContaining({
        p_special_notes: 'Extra spicy',
        p_category: 'Main Course'
      }));
    });
    
    test('should return success: false and error message if image upload fails', async () => {
      const files = [createMockFile('fail.jpg')];
      const formData = { ...basicFormData, images: files };
      const uploadErrorMessage = 'Failed to upload image';
      uploadMock.mockResolvedValueOnce({ data: null, error: { message: uploadErrorMessage } });

      const result = await submissionsAPI.submitPublicForm(formData);

      expect(rpcMock).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: expect.stringContaining(uploadErrorMessage) });
    });

    test('should return success: false and error message if getPublicUrl fails (returns null URL)', async () => {
      const files = [createMockFile('url-fail.jpg')];
      const formData = { ...basicFormData, images: files };
      // Mock getPublicUrl to simulate failure by not returning a publicUrl in data
      getPublicUrlMock.mockReturnValueOnce({ data: { publicUrl: null } }); 

      const result = await submissionsAPI.submitPublicForm(formData);

      expect(rpcMock).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: 'Failed to get public URL for uploaded file.' });
    });
    
    test('should return success: false and error message if getPublicUrl returns no data', async () => {
      const files = [createMockFile('url-fail-nodata.jpg')];
      const formData = { ...basicFormData, images: files };
      getPublicUrlMock.mockReturnValueOnce({ data: null });

      const result = await submissionsAPI.submitPublicForm(formData);
      expect(rpcMock).not.toHaveBeenCalled();
      // Update the expected error message
      expect(result).toEqual({ success: false, error: "Cannot read properties of null (reading 'publicUrl')" });
    });


    test('should return success: false and error message if RPC call fails', async () => {
      const files = [createMockFile('rpc-fail.jpg')];
      const formData = { ...basicFormData, images: files };
      const rpcErrorMessage = 'Database RPC error';
      rpcMock.mockResolvedValueOnce({ data: null, error: { message: rpcErrorMessage } });

      const result = await submissionsAPI.submitPublicForm(formData);

      expect(result).toEqual({ success: false, error: rpcErrorMessage });
    });
    
    test('should correctly stringify image URLs for RPC call', async () => {
      const files = [createMockFile('img1.jpg'), createMockFile('img2.jpg')];
      const formData = { ...basicFormData, images: files };
      const mockUrl1 = 'http://supabase.io/img1.jpg';
      const mockUrl2 = 'http://supabase.io/img2.jpg';

      // Setup mocks for two different URLs
      uploadMock
        .mockResolvedValueOnce({ data: { path: 'img1.jpg' }, error: null })
        .mockResolvedValueOnce({ data: { path: 'img2.jpg' }, error: null });
      getPublicUrlMock
        .mockReturnValueOnce({ data: { publicUrl: mockUrl1 } })
        .mockReturnValueOnce({ data: { publicUrl: mockUrl2 } });

      await submissionsAPI.submitPublicForm(formData);

      expect(rpcMock).toHaveBeenCalledWith(
        'public_submit_item_by_restaurant_name',
        expect.objectContaining({
          p_image_urls: JSON.stringify([mockUrl1, mockUrl2]),
        })
      );
    });
  });
}); 