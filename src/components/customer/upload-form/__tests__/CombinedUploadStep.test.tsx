import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CombinedUploadStep from '../steps/CombinedUploadStep';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

// Mock the NewItemFormContext
const mockUpdateFormData = vi.fn();
const mockResetFormData = vi.fn();

vi.mock('@/contexts/NewItemFormContext', () => ({
  NewItemFormProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNewItemForm: () => ({
    formData: {
      itemName: '',
      itemType: '',
      description: '',
      specialNotes: '',
      referenceImages: [],
      restaurantName: '',
      submitterName: ''
    },
    updateFormData: mockUpdateFormData,
    resetFormData: mockResetFormData
  })
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({ 'data-testid': 'dropzone' }),
    getInputProps: () => ({ 'data-testid': 'file-input' }),
    isDragActive: false
  })
}));

const renderComponent = (props = {}) => {
  return render(
    <NewItemFormProvider>
      <CombinedUploadStep 
        errors={{}}
        clearExternalErrors={vi.fn()}
        {...props}
      />
    </NewItemFormProvider>
  );
};

describe('CombinedUploadStep - Add Another Dish Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage
    window.localStorage.clear();
  });

  describe('Add Another Dish Toggle', () => {
    it('should not show add another dish button initially', () => {
      renderComponent();
      
      expect(screen.queryByText('רוצים להעלות מנה נוספת?')).not.toBeInTheDocument();
      expect(screen.queryByText('הוספת מנה נוספת')).not.toBeInTheDocument();
    });

    it('should show add another dish section when quality is confirmed and images exist', async () => {
      // Mock form data with images
      vi.mocked(require('@/contexts/NewItemFormContext').useNewItemForm).mockReturnValue({
        formData: {
          itemName: 'Test Dish',
          itemType: 'מנה',
          description: 'Test description',
          specialNotes: '',
          referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          restaurantName: '',
          submitterName: ''
        },
        updateFormData: mockUpdateFormData,
        resetFormData: mockResetFormData
      });

      renderComponent();
      
      // Find and check the quality confirmation checkbox
      const qualityCheckbox = screen.getByLabelText('וידאתי שהתמונות ברורות ומובנות');
      expect(qualityCheckbox).toBeInTheDocument();
      
      // Click the checkbox to confirm quality
      fireEvent.click(qualityCheckbox);
      
      // Wait for the add another dish section to appear
      await waitFor(() => {
        expect(screen.getByText('רוצים להעלות מנה נוספת?')).toBeInTheDocument();
      });
      
      expect(screen.getByText('תוכלו להעלות מנה נוספת עם תמונות ופרטים נפרדים')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
    });

    it('should not show add another dish section when quality confirmed but no images', async () => {
      renderComponent();
      
      // Try to find quality checkbox (shouldn't exist without images)
      expect(screen.queryByLabelText('וידאתי שהתמונות ברורות ומובנות')).not.toBeInTheDocument();
      expect(screen.queryByText('רוצים להעלות מנה נוספת?')).not.toBeInTheDocument();
    });

    it('should call resetFormData when add another dish button is clicked', async () => {
      // Mock form data with images
      vi.mocked(require('@/contexts/NewItemFormContext').useNewItemForm).mockReturnValue({
        formData: {
          itemName: 'Test Dish',
          itemType: 'מנה',
          description: 'Test description',
          specialNotes: '',
          referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          restaurantName: '',
          submitterName: ''
        },
        updateFormData: mockUpdateFormData,
        resetFormData: mockResetFormData
      });

      renderComponent();
      
      // Check quality confirmation
      const qualityCheckbox = screen.getByLabelText('וידאתי שהתמונות ברורות ומובנות');
      fireEvent.click(qualityCheckbox);
      
      // Wait for add another dish button to appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
      });
      
      // Click the add another dish button
      const addButton = screen.getByRole('button', { name: /הוספת מנה נוספת/i });
      fireEvent.click(addButton);
      
      // Verify resetFormData was called
      expect(mockResetFormData).toHaveBeenCalledTimes(1);
    });

    it('should reset quality confirmation state when add another dish is clicked', async () => {
      // Mock form data with images
      vi.mocked(require('@/contexts/NewItemFormContext').useNewItemForm).mockReturnValue({
        formData: {
          itemName: 'Test Dish',
          itemType: 'מנה',
          description: 'Test description',
          specialNotes: '',
          referenceImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
          restaurantName: '',
          submitterName: ''
        },
        updateFormData: mockUpdateFormData,
        resetFormData: mockResetFormData
      });

      renderComponent();
      
      // Check quality confirmation
      const qualityCheckbox = screen.getByLabelText('וידאתי שהתמונות ברורות ומובנות');
      fireEvent.click(qualityCheckbox);
      
      // Verify localStorage was set
      expect(window.localStorage.getItem('imageQualityConfirmed')).toBe('true');
      
      // Wait for add another dish button and click it
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /הוספת מנה נוספת/i });
      fireEvent.click(addButton);
      
      // Verify localStorage was reset
      expect(window.localStorage.getItem('imageQualityConfirmed')).toBe('false');
    });
  });

  describe('Form Integration', () => {
    it('should render all required form sections', () => {
      renderComponent();
      
      // Check for main sections
      expect(screen.getByText('פרטי הפריט')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('פרטי יצירת קשר')).toBeInTheDocument();
      
      // Check for form fields
      expect(screen.getByLabelText('שם הפריט')).toBeInTheDocument();
      expect(screen.getByLabelText(/סוג הפריט/)).toBeInTheDocument();
      expect(screen.getByLabelText('שם המסעדה / העסק')).toBeInTheDocument();
      expect(screen.getByLabelText('שם איש הקשר')).toBeInTheDocument();
    });

    it('should show important information section', () => {
      renderComponent();
      
      expect(screen.getByText('חשוב לדעת:')).toBeInTheDocument();
      expect(screen.getByText(/מה שאתם מעלים = מה שאתם מקבלים/)).toBeInTheDocument();
    });

    it('should handle form field changes', () => {
      renderComponent();
      
      const itemNameInput = screen.getByLabelText('שם הפריט');
      fireEvent.change(itemNameInput, { target: { value: 'Pizza Margherita' } });
      
      expect(mockUpdateFormData).toHaveBeenCalledWith({ itemName: 'Pizza Margherita' });
    });
  });

  describe('Error Handling', () => {
    it('should display form errors when provided', () => {
      const errors = {
        itemName: 'שם הפריט נדרש',
        itemType: 'סוג הפריט נדרש'
      };
      
      renderComponent({ errors });
      
      expect(screen.getByText('שם הפריט נדרש')).toBeInTheDocument();
      expect(screen.getByText('סוג הפריט נדרש')).toBeInTheDocument();
    });
  });

  describe('Hebrew Language Support', () => {
    it('should display all text in Hebrew', () => {
      renderComponent();
      
      // Check Hebrew text elements
      expect(screen.getByText('פרטי הפריט')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('פרטי יצירת קשר')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('לדוגמה: פסטה קרבונרה, מוחיטו קלאסי')).toBeInTheDocument();
    });
  });
}); 