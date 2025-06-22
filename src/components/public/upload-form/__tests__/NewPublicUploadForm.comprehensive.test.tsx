import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import NewPublicUploadForm from '../NewPublicUploadForm';
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

vi.mock('@/utils/pathSanitization', () => ({
  sanitizePathComponent: vi.fn((text: string) => text.replace(/[^a-zA-Z0-9-]/g, '-'))
}));

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Test wrapper component
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <NewItemFormProvider>
          {children}
        </NewItemFormProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('NewPublicUploadForm - Client Linking Feature', () => {
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

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the form with all steps', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      expect(screen.getByText('פרטי המנה ותמונות')).toBeInTheDocument();
      expect(screen.getByText('בחירת קטגוריה')).toBeInTheDocument();
      expect(screen.getByText('בחירת סגנון')).toBeInTheDocument();
      expect(screen.getByText('תשלום וסיכום')).toBeInTheDocument();
    });

    it('should show step 1 as active initially', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const step1 = screen.getByText('1');
      expect(step1).toHaveClass('bg-[#8B1E3F]');
    });

    it('should display navigation buttons correctly', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      expect(screen.getByText('הבא')).toBeInTheDocument();
      expect(screen.queryByText('הקודם')).not.toBeInTheDocument(); // Not shown on first step
    });
  });

  describe('Form Navigation', () => {
    it('should navigate to next step when valid', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Fill required fields for step 1
      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      const nameInput = screen.getByPlaceholderText('שם מלא');
      const phoneInput = screen.getByPlaceholderText('מספר טלפון');

      fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
      fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
      fireEvent.change(phoneInput, { target: { value: '0501234567' } });

      const nextButton = screen.getByText('הבא');
      fireEvent.click(nextButton);

      await waitFor(() => {
        const step2 = screen.getByText('2');
        expect(step2).toHaveClass('bg-[#8B1E3F]');
      });
    });

    it('should show previous button on steps 2-4', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Navigate to step 2
      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
      
      const nextButton = screen.getByText('הבא');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('הקודם')).toBeInTheDocument();
      });
    });

    it('should navigate back to previous step', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Navigate to step 2 first
      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
      
      fireEvent.click(screen.getByText('הבא'));

      await waitFor(() => {
        const step2 = screen.getByText('2');
        expect(step2).toHaveClass('bg-[#8B1E3F]');
      });

      // Navigate back
      fireEvent.click(screen.getByText('הקודם'));

      await waitFor(() => {
        const step1 = screen.getByText('1');
        expect(step1).toHaveClass('bg-[#8B1E3F]');
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields in step 1', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const nextButton = screen.getByText('הבא');
      fireEvent.click(nextButton);

      // Should stay on step 1 due to validation
      const step1 = screen.getByText('1');
      expect(step1).toHaveClass('bg-[#8B1E3F]');
    });

    it('should validate restaurant name field', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const nameInput = screen.getByPlaceholderText('שם מלא');
      const phoneInput = screen.getByPlaceholderText('מספר טלפון');

      fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
      fireEvent.change(phoneInput, { target: { value: '0501234567' } });

      const nextButton = screen.getByText('הבא');
      fireEvent.click(nextButton);

      // Should stay on step 1 - restaurant name missing
      const step1 = screen.getByText('1');
      expect(step1).toHaveClass('bg-[#8B1E3F]');
    });

    it('should validate phone number format', () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      const nameInput = screen.getByPlaceholderText('שם מלא');
      const phoneInput = screen.getByPlaceholderText('מספר טלפון');

      fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
      fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

      const nextButton = screen.getByText('הבא');
      fireEvent.click(nextButton);

      // Should stay on step 1 - invalid phone
      const step1 = screen.getByText('1');
      expect(step1).toHaveClass('bg-[#8B1E3F]');
    });
  });

  describe('Client Linking - Happy Path', () => {
    it('should create new client when restaurant does not exist', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Mock client not found
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      // Navigate to payment step and submit
      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).toHaveBeenCalledWith({
          client_id: 'mock-uuid-123',
          user_auth_id: 'mock-uuid-123',
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: 'placeholder@email.com',
          phone: '0501234567'
        });
      });
    });

    it('should use existing client when restaurant exists', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Mock existing client found
      const existingClient = { client_id: 'existing-client-123' };
      mockClientSelect.mockResolvedValue({ data: existingClient, error: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).not.toHaveBeenCalled();
        expect(mockSubmissionInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            client_id: 'existing-client-123'
          })
        );
      });
    });

    it('should create submission linked to client', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockSubmissionInsert).toHaveBeenCalledWith({
          submission_id: 'mock-uuid-123',
          client_id: 'mock-uuid-123',
          item_name_at_submission: 'בדיקה מנה',
          item_type: 'מנה',
          submission_status: 'ממתינה לעיבוד',
          original_image_urls: ['https://example.com/image.jpg'],
          uploaded_at: expect.any(String),
          restaurant_name: 'מסעדת בדיקה',
          contact_name: 'יוסי כהן',
          email: null,
          phone: '0501234567',
          description: null
        });
      });
    });

    it('should upload images to correct storage path', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockStorageUpload).toHaveBeenCalledWith(
          expect.stringMatching(/^public-uploads\/\d+\/מנה\/mock-uuid-123\./),
          expect.any(File)
        );
      });
    });

    it('should show success message and redirect', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('ההזמנה נשלחה בהצלחה!');
      });

      // Check redirect after delay
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(mockLocation.href).toBe('/thank-you');
    });
  });

  describe('Error Handling', () => {
    it('should handle client creation error', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });
      mockClientInsert.mockResolvedValue({ 
        error: { message: 'Database connection failed' } 
      });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
      });
    });

    it('should handle submission creation error', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });
      mockSubmissionInsert.mockResolvedValue({ 
        error: { message: 'Submission failed' } 
      });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
      });
    });

    it('should handle image upload error', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockStorageUpload.mockResolvedValue({ 
        error: { message: 'Upload failed' } 
      });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
      });
    });

    it('should handle missing public URL error', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockStorageGetPublicUrl.mockReturnValue({ data: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockSubmissionInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            original_image_urls: []
          })
        );
      });
    });

    it('should handle client lookup error', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('אנא נסו שוב');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dish images array', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      // Navigate to payment without adding images
      await navigateToPaymentStepWithoutImages();
      await submitForm();

      await waitFor(() => {
        expect(mockSubmissionInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            original_image_urls: []
          })
        );
      });
    });

    it('should handle optional email field', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'placeholder@email.com' // Should use placeholder when email not provided
          })
        );
      });
    });

    it('should handle very long restaurant names', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const longName = 'מ'.repeat(200);
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      // Fill form with long restaurant name
      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      fireEvent.change(restaurantInput, { target: { value: longName } });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            restaurant_name: longName
          })
        );
      });
    });

    it('should handle special characters in restaurant name', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      const specialName = 'מסעדת "הבית" & גריל - 2024!';
      mockClientSelect.mockResolvedValue({ data: null, error: null });

      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      fireEvent.change(restaurantInput, { target: { value: specialName } });

      await navigateToPaymentStep();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            restaurant_name: specialName
          })
        );
      });
    });

    it('should handle missing phone number', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      await navigateToPaymentStepWithoutPhone();
      await submitForm();

      await waitFor(() => {
        expect(mockClientInsert).toHaveBeenCalledWith(
          expect.objectContaining({
            phone: 'N/A'
          })
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full submission flow', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      mockClientSelect.mockResolvedValue({ data: null, error: null });

      // Step 1: Fill basic details
      await fillStep1();
      fireEvent.click(screen.getByText('הבא'));

      // Step 2: Select category
      await waitFor(() => {
        fireEvent.click(screen.getByText('אפליקציות משלוח'));
      });
      fireEvent.click(screen.getByText('הבא'));

      // Step 3: Select style
      await waitFor(() => {
        fireEvent.click(screen.getByText('רקע לבן'));
      });
      fireEvent.click(screen.getByText('הבא'));

      // Step 4: Submit payment
      await waitFor(() => {
        const paymentButton = screen.getByText(/בצע תשלום/);
        fireEvent.click(paymentButton);
      });

      // Verify all operations completed
      await waitFor(() => {
        expect(mockStorageUpload).toHaveBeenCalled();
        expect(mockClientInsert).toHaveBeenCalled();
        expect(mockSubmissionInsert).toHaveBeenCalled();
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should maintain form state across navigation', async () => {
      const wrapper = createWrapper();
      render(<NewPublicUploadForm />, { wrapper });

      // Fill step 1
      const restaurantInput = screen.getByPlaceholderText('שם העסק');
      fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });

      fireEvent.click(screen.getByText('הבא'));

      // Navigate back and verify data persists
      await waitFor(() => {
        fireEvent.click(screen.getByText('הקודם'));
      });

      await waitFor(() => {
        expect(restaurantInput).toHaveValue('מסעדת בדיקה');
      });
    });
  });

  // Helper functions
  async function fillStep1() {
    const restaurantInput = screen.getByPlaceholderText('שם העסק');
    const nameInput = screen.getByPlaceholderText('שם מלא');
    const phoneInput = screen.getByPlaceholderText('מספר טלפון');

    fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
    fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
    fireEvent.change(phoneInput, { target: { value: '0501234567' } });

    // Add mock dish
    const dishNameInput = screen.getByPlaceholderText('שם המנה');
    const dishTypeSelect = screen.getByRole('combobox');
    
    fireEvent.change(dishNameInput, { target: { value: 'בדיקה מנה' } });
    fireEvent.click(dishTypeSelect);
    fireEvent.click(screen.getByText('מנה'));

    // Add mock image file
    const fileInput = screen.getByLabelText(/העלאת תמונות/);
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [mockFile] } });
  }

  async function navigateToPaymentStep() {
    await fillStep1();
    
    // Navigate through steps
    fireEvent.click(screen.getByText('הבא'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('אפליקציות משלוח'));
    });
    fireEvent.click(screen.getByText('הבא'));
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('רקע לבן'));
    });
    fireEvent.click(screen.getByText('הבא'));
  }

  async function navigateToPaymentStepWithoutImages() {
    const restaurantInput = screen.getByPlaceholderText('שם העסק');
    const nameInput = screen.getByPlaceholderText('שם מלא');
    const phoneInput = screen.getByPlaceholderText('מספר טלפון');

    fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
    fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
    fireEvent.change(phoneInput, { target: { value: '0501234567' } });

    const dishNameInput = screen.getByPlaceholderText('שם המנה');
    fireEvent.change(dishNameInput, { target: { value: 'בדיקה מנה' } });

    // Navigate without adding images
    fireEvent.click(screen.getByText('הבא'));
    await waitFor(() => fireEvent.click(screen.getByText('אפליקציות משלוח')));
    fireEvent.click(screen.getByText('הבא'));
    await waitFor(() => fireEvent.click(screen.getByText('רקע לבן')));
    fireEvent.click(screen.getByText('הבא'));
  }

  async function navigateToPaymentStepWithoutPhone() {
    const restaurantInput = screen.getByPlaceholderText('שם העסק');
    const nameInput = screen.getByPlaceholderText('שם מלא');

    fireEvent.change(restaurantInput, { target: { value: 'מסעדת בדיקה' } });
    fireEvent.change(nameInput, { target: { value: 'יוסי כהן' } });
    // Skip phone input

    const dishNameInput = screen.getByPlaceholderText('שם המנה');
    fireEvent.change(dishNameInput, { target: { value: 'בדיקה מנה' } });

    fireEvent.click(screen.getByText('הבא'));
    await waitFor(() => fireEvent.click(screen.getByText('אפליקציות משלוח')));
    fireEvent.click(screen.getByText('הבא'));
    await waitFor(() => fireEvent.click(screen.getByText('רקע לבן')));
    fireEvent.click(screen.getByText('הבא'));
  }

  async function submitForm() {
    await waitFor(() => {
      const paymentButton = screen.getByText(/בצע תשלום/);
      fireEvent.click(paymentButton);
    });
  }
}); 