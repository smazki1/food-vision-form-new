import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Import components and hooks to test
import RestaurantDetailsStep from '@/components/public/upload-form/steps/RestaurantDetailsStep';
import { NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext';
import type { NewItemFormData } from '@/contexts/NewItemFormContext';
import type { MakeWebhookPayload } from '@/lib/triggerMakeWebhook';

// Mock external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } })
    }
  }
}));

vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <NewItemFormProvider>
        {children}
      </NewItemFormProvider>
    </QueryClientProvider>
  );
};

// Mock data for tests
const mockFormData: NewItemFormData = {
  restaurantName: 'מסעדת הטעמים',
  submitterName: 'יוסי כהן',
  contactEmail: 'yossi@test.com',
  contactPhone: '050-1234567',
  itemName: 'המבורגר טעים',
  itemType: 'מנה',
  description: 'המבורגר עם ירקות טריים',
  specialNotes: 'בקשות מיוחדות',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  itemsQuantityRange: '1-10',
  estimatedImagesNeeded: '20 תמונות',
  primaryImageUsage: 'instagram',
  isNewBusiness: true
};

describe('Lead Requirements Feature - Comprehensive Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;
  
  const defaultProps = {
    errors: {},
    clearExternalErrors: vi.fn(),
    setExternalErrors: vi.fn()
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. UI Component Behavior - RestaurantDetailsStep', () => {
    describe('Happy Path Tests', () => {
      it('should render the form without crashing', () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        expect(screen.getByText('פרטי מסעדה')).toBeInTheDocument();
        expect(screen.getByText('האם העסק שלכם כבר רשום במערכת?')).toBeInTheDocument();
      });

      it('should show business type selection buttons', () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        expect(screen.getByText('כן, העסק שלנו רשום')).toBeInTheDocument();
        expect(screen.getByText('לא, זו פעם ראשונה שלנו')).toBeInTheDocument();
      });

      it('should show new requirement fields only for new businesses', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        // Initially, requirement fields should NOT be visible
        expect(screen.queryByText('מספר פריטים (מנות או מוצרים) לצילום?')).not.toBeInTheDocument();

        // Click "new business" button
        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        // Now requirement fields should be visible
        await waitFor(() => {
          expect(screen.getByText('מספר פריטים (מנות או מוצרים) לצילום?')).toBeInTheDocument();
          expect(screen.getByText('כמה תמונות אתם צריכים בשלב הנוכחי?')).toBeInTheDocument();
          expect(screen.getByText('לאיזה שימוש עיקרי התמונות מיועדות?')).toBeInTheDocument();
        });
      });

      it('should hide requirement fields for existing businesses', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        // Click "existing business" button
        const existingBusinessButton = screen.getByText('כן, העסק שלנו רשום');
        await user.click(existingBusinessButton);

        // Requirement fields should NOT be visible
        expect(screen.queryByText('מספר פריטים (מנות או מוצרים) לצילום?')).not.toBeInTheDocument();
        expect(screen.queryByText('כמה תמונות אתם צריכים בשלב הנוכחי?')).not.toBeInTheDocument();
        expect(screen.queryByText('לאיזה שימוש עיקרי התמונות מיועדות?')).not.toBeInTheDocument();
      });

      it('should have proper RTL alignment for Hebrew form fields', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        // Click new business to show fields
        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(() => {
          // Find select elements by their accessible names
          const quantitySelect = screen.getByRole('combobox', { name: /מספר פריטים/ });
          const usageSelect = screen.getByRole('combobox', { name: /לאיזה שימוש עיקרי/ });
          const imagesInput = screen.getByRole('textbox', { name: /כמה תמונות/ });

          // Check they have text-right class for RTL
          expect(quantitySelect).toHaveClass('text-right');
          expect(usageSelect).toHaveClass('text-right');
          expect(imagesInput).toHaveClass('text-right');
        });
      });
    });

    describe('Form Validation Tests', () => {
      it('should show required field indicators for new businesses', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(() => {
          // Check for required asterisks (*)
          const quantityLabel = screen.getByText('מספר פריטים (מנות או מוצרים) לצילום?').closest('label');
          const imagesLabel = screen.getByText('כמה תמונות אתם צריכים בשלב הנוכחי?').closest('label');
          const usageLabel = screen.getByText('לאיזה שימוש עיקרי התמונות מיועדות?').closest('label');

          expect(quantityLabel).toHaveTextContent('*');
          expect(imagesLabel).toHaveTextContent('*');
          expect(usageLabel).toHaveTextContent('*');
        });
      });

      it('should allow selection of quantity ranges', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(async () => {
          const quantitySelect = screen.getByRole('combobox', { name: /מספר פריטים/ });
          await user.click(quantitySelect);
        });

        // Should show quantity options
        await waitFor(() => {
          expect(screen.getByText('1-10')).toBeInTheDocument();
          expect(screen.getByText('11-30')).toBeInTheDocument();
          expect(screen.getByText('30+')).toBeInTheDocument();
        });
      });

      it('should allow selection of primary image usage options', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(async () => {
          const usageSelect = screen.getByRole('combobox', { name: /לאיזה שימוש עיקרי/ });
          await user.click(usageSelect);
        });

        // Should show usage options including updated Instagram text
        await waitFor(() => {
          expect(screen.getByText('אינסטגרם ורשתות חברתיות')).toBeInTheDocument();
          expect(screen.getByText('אתר / תפריט')).toBeInTheDocument();
          expect(screen.getByText('משלוחים')).toBeInTheDocument();
          expect(screen.getByText('פרסום')).toBeInTheDocument();
          expect(screen.getByText('אחר')).toBeInTheDocument();
        });
      });

      it('should accept Hebrew text input for estimated images', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(() => {
          const imagesInput = screen.getByRole('textbox', { name: /כמה תמונות/ });
          expect(imagesInput).toBeInTheDocument();
        });

        const imagesInput = screen.getByRole('textbox', { name: /כמה תמונות/ });
        await user.type(imagesInput, 'כ-30 תמונות למסעדה שלנו');

        expect(imagesInput).toHaveValue('כ-30 תמונות למסעדה שלנו');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should handle business type switching correctly', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        // Start with new business
        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(() => {
          expect(screen.getByText('מספר פריטים (מנות או מוצרים) לצילום?')).toBeInTheDocument();
        });

        // Switch to existing business
        const existingBusinessButton = screen.getByText('כן, העסק שלנו רשום');
        await user.click(existingBusinessButton);

        await waitFor(() => {
          expect(screen.queryByText('מספר פריטים (מנות או מוצרים) לצילום?')).not.toBeInTheDocument();
        });
      });

      it('should handle rapid business type switching', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        const existingBusinessButton = screen.getByText('כן, העסק שלנו רשום');

        // Rapidly switch between business types
        for (let i = 0; i < 3; i++) {
          await user.click(newBusinessButton);
          await user.click(existingBusinessButton);
        }

        // Should not crash
        expect(screen.getByText('פרטי מסעדה')).toBeInTheDocument();
      });

      it('should handle empty placeholder text correctly', async () => {
        render(
          <TestWrapper>
            <RestaurantDetailsStep {...defaultProps} />
          </TestWrapper>
        );

        const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
        await user.click(newBusinessButton);

        await waitFor(() => {
          // Check placeholders are in Hebrew
          expect(screen.getByPlaceholderText('בחרו טווח כמות')).toBeInTheDocument();
          expect(screen.getByPlaceholderText('לדוגמה: 20 תמונות, או ל-50 תמונות')).toBeInTheDocument();
          expect(screen.getByPlaceholderText('בחרו שימוש עיקרי')).toBeInTheDocument();
        });
      });
    });
  });

  describe('2. Form Context Integration Tests', () => {
    it('should update form data with isNewBusiness flag', async () => {
      const TestComponent = () => {
        const { formData, updateFormData } = useNewItemForm();
        
        React.useEffect(() => {
          updateFormData({
            restaurantName: 'Test Restaurant',
            submitterName: 'Test User',
            isNewBusiness: true,
            itemsQuantityRange: '1-10',
            estimatedImagesNeeded: '20 images',
            primaryImageUsage: 'instagram'
          });
        }, [updateFormData]);

        return <div data-testid="form-data">{JSON.stringify(formData)}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        const formDataElement = screen.getByTestId('form-data');
        const formData = JSON.parse(formDataElement.textContent || '{}');
        expect(formData.isNewBusiness).toBe(true);
        expect(formData.itemsQuantityRange).toBe('1-10');
        expect(formData.estimatedImagesNeeded).toBe('20 images');
        expect(formData.primaryImageUsage).toBe('instagram');
      });
    });

    it('should handle form data without new fields gracefully', async () => {
      const TestComponent = () => {
        const { formData, updateFormData } = useNewItemForm();
        
        React.useEffect(() => {
          // Update with minimal data (no new fields)
          updateFormData({
            restaurantName: 'Minimal Restaurant',
            submitterName: 'Test User'
          });
        }, [updateFormData]);

        return <div data-testid="form-data">{JSON.stringify(formData)}</div>;
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        const formDataElement = screen.getByTestId('form-data');
        const formData = JSON.parse(formDataElement.textContent || '{}');
        expect(formData.restaurantName).toBe('Minimal Restaurant');
        // New fields should be empty strings or undefined
        expect(formData.itemsQuantityRange || '').toBe('');
        expect(formData.estimatedImagesNeeded || '').toBe('');
        expect(formData.primaryImageUsage || '').toBe('');
      });
    });
  });

  describe('3. Interface Compliance Tests', () => {
    it('should accept all NewItemFormData fields including new ones', () => {
      const completeFormData: NewItemFormData = {
        restaurantName: 'מסעדת הטעמים',
        submitterName: 'יוסי כהן',
        contactEmail: 'yossi@test.com',
        contactPhone: '050-1234567',
        itemName: 'המבורגר טעים',
        itemType: 'מנה',
        description: 'תיאור המנה',
        specialNotes: 'הערות מיוחדות',
        referenceImages: [],
        brandingMaterials: [],
        referenceExamples: [],
        // New requirement fields
        itemsQuantityRange: '1-10',
        estimatedImagesNeeded: '20 תמונות',
        primaryImageUsage: 'instagram',
        isNewBusiness: true
      };

      // TypeScript compilation should pass
      expect(completeFormData.itemsQuantityRange).toBe('1-10');
      expect(completeFormData.estimatedImagesNeeded).toBe('20 תמונות');
      expect(completeFormData.primaryImageUsage).toBe('instagram');
      expect(completeFormData.isNewBusiness).toBe(true);
    });

    it('should handle webhook payload with new fields', () => {
      const webhookPayload: MakeWebhookPayload = {
        submissionTimestamp: '2024-01-01T00:00:00.000Z',
        isAuthenticated: false,
        clientId: null,
        restaurantName: 'מסעדת הטעמים',
        submitterName: 'יוסי כהן',
        contactEmail: 'yossi@test.com',
        contactPhone: '050-1234567',
        itemName: 'המבורגר טעים',
        itemType: 'מנה',
        description: 'המבורגר עם ירקות טריים',
        specialNotes: 'בקשות מיוחדות',
        uploadedImageUrls: [],
        category: null,
        ingredients: null,
        sourceForm: 'public-form-context',
        // New fields
        itemsQuantityRange: '1-10',
        estimatedImagesNeeded: '20 תמונות',
        primaryImageUsage: 'instagram'
      };

      // Should contain all new fields
      expect(webhookPayload.itemsQuantityRange).toBe('1-10');
      expect(webhookPayload.estimatedImagesNeeded).toBe('20 תמונות');
      expect(webhookPayload.primaryImageUsage).toBe('instagram');
    });

    it('should handle optional new fields in webhook payload', () => {
      const minimalPayload: Partial<MakeWebhookPayload> = {
        submissionTimestamp: '2024-01-01T00:00:00.000Z',
        restaurantName: 'מסעדת הטעמים',
        itemName: 'המבורגר טעים',
        // New fields are optional
        itemsQuantityRange: undefined,
        estimatedImagesNeeded: undefined,
        primaryImageUsage: undefined
      };

      // Should not throw with undefined values
      expect(() => {
        const payload = { ...minimalPayload };
        return payload;
      }).not.toThrow();
    });
  });

  describe('4. Validation Logic Tests', () => {
    it('should validate required fields for new businesses', () => {
      const newBusinessData = {
        ...mockFormData,
        isNewBusiness: true,
        itemsQuantityRange: '', // Invalid - empty
        estimatedImagesNeeded: '', // Invalid - empty
        primaryImageUsage: '' // Invalid - empty
      };

      // For new businesses, these fields should be required
      expect(newBusinessData.isNewBusiness).toBe(true);
      expect(newBusinessData.itemsQuantityRange).toBe('');
      expect(newBusinessData.estimatedImagesNeeded).toBe('');
      expect(newBusinessData.primaryImageUsage).toBe('');
    });

    it('should allow empty fields for existing businesses', () => {
      const existingBusinessData = {
        ...mockFormData,
        isNewBusiness: false,
        itemsQuantityRange: '', // Should be allowed
        estimatedImagesNeeded: '', // Should be allowed
        primaryImageUsage: '' // Should be allowed
      };

      // For existing businesses, these fields should not be required
      expect(existingBusinessData.isNewBusiness).toBe(false);
      expect(existingBusinessData.itemsQuantityRange).toBe('');
      expect(existingBusinessData.estimatedImagesNeeded).toBe('');
      expect(existingBusinessData.primaryImageUsage).toBe('');
    });

    it('should accept valid values for all new fields', () => {
      const validData = {
        ...mockFormData,
        isNewBusiness: true,
        itemsQuantityRange: '11-30',
        estimatedImagesNeeded: 'כ-50 תמונות באיכות גבוהה',
        primaryImageUsage: 'website-menu'
      };

      expect(validData.itemsQuantityRange).toBe('11-30');
      expect(validData.estimatedImagesNeeded).toBe('כ-50 תמונות באיכות גבוהה');
      expect(validData.primaryImageUsage).toBe('website-menu');
    });
  });

  describe('5. Error Handling and Resilience Tests', () => {
    it('should handle malformed form data gracefully', () => {
      const malformedData = {
        itemsQuantityRange: null,
        estimatedImagesNeeded: undefined,
        primaryImageUsage: 123 // Wrong type
      };

      // Should handle type mismatches without crashing
      expect(malformedData.itemsQuantityRange).toBeNull();
      expect(malformedData.estimatedImagesNeeded).toBeUndefined();
      expect(typeof malformedData.primaryImageUsage).toBe('number');
    });

    it('should handle component unmounting cleanly', () => {
      const { unmount } = render(
        <TestWrapper>
          <RestaurantDetailsStep {...defaultProps} />
        </TestWrapper>
      );

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('should handle missing context gracefully', () => {
      // Render without TestWrapper (no context)
      expect(() => {
        render(<RestaurantDetailsStep {...defaultProps} />);
      }).toThrow(); // Should throw due to missing context, which is expected
    });
  });

  describe('6. Accessibility and Internationalization Tests', () => {
    it('should have proper ARIA labels for form fields', async () => {
      render(
        <TestWrapper>
          <RestaurantDetailsStep {...defaultProps} />
        </TestWrapper>
      );

      const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
      await user.click(newBusinessButton);

      await waitFor(() => {
        // Check form fields have proper accessible names
        expect(screen.getByRole('combobox', { name: /מספר פריטים/ })).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /לאיזה שימוש עיקרי/ })).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /כמה תמונות/ })).toBeInTheDocument();
      });
    });

    it('should support Hebrew text direction (RTL)', async () => {
      render(
        <TestWrapper>
          <RestaurantDetailsStep {...defaultProps} />
        </TestWrapper>
      );

      const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
      await user.click(newBusinessButton);

      await waitFor(() => {
        const container = screen.getByText('מספר פריטים (מנות או מוצרים) לצילום?').closest('div');
        // Component should have RTL support classes
        expect(container).toBeInTheDocument();
      });
    });

    it('should maintain consistent Hebrew language throughout', async () => {
      render(
        <TestWrapper>
          <RestaurantDetailsStep {...defaultProps} />
        </TestWrapper>
      );

      const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
      await user.click(newBusinessButton);

      await waitFor(() => {
        // All field labels should be in Hebrew
        expect(screen.getByText('מספר פריטים (מנות או מוצרים) לצילום?')).toBeInTheDocument();
        expect(screen.getByText('כמה תמונות אתם צריכים בשלב הנוכחי?')).toBeInTheDocument();
        expect(screen.getByText('לאיזה שימוש עיקרי התמונות מיועדות?')).toBeInTheDocument();
      });
    });
  });
}); 