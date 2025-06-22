import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CombinedUploadStep from '../steps/CombinedUploadStep';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

// Mock the NewItemFormContext
vi.mock('@/contexts/NewItemFormContext', () => ({
  NewItemFormProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useNewItemForm: vi.fn()
}));

const mockUpdateFormData = vi.fn();
const mockResetFormData = vi.fn();
const mockAddDish = vi.fn().mockReturnValue('2');
const mockRemoveDish = vi.fn();
const mockUpdateDish = vi.fn();
const mockGetDish = vi.fn();

const defaultFormData = {
  itemName: '',
  itemType: '',
  description: '',
  specialNotes: '',
  referenceImages: [],
  restaurantName: '',
  submitterName: '',
  dishes: [
    {
      id: '1',
      itemName: '',
      itemType: '',
      description: '',
      specialNotes: '',
      referenceImages: [],
      brandingMaterials: [],
      referenceExamples: [],
      isCustomItemType: false,
      customItemType: '',
      qualityConfirmed: false
    }
  ]
};

const renderComponent = (props = {}) => {
  // Mock the useNewItemForm hook with all required functions
  vi.mocked(require('@/contexts/NewItemFormContext').useNewItemForm).mockReturnValue({
    formData: defaultFormData,
    updateFormData: mockUpdateFormData,
    resetFormData: mockResetFormData,
    addDish: mockAddDish,
    removeDish: mockRemoveDish,
    updateDish: mockUpdateDish,
    getDish: mockGetDish
  });

  return render(
    <CombinedUploadStep 
      errors={{}}
      clearExternalErrors={vi.fn()}
      {...props}
    />
  );
};

describe('CombinedUploadStep - Add Another Dish Toggle Feature', () => {
      beforeEach(() => {
      vi.clearAllMocks();
      window.localStorage.clear();
      // Reset form data to initial state
      defaultFormData.referenceImages = [];
    });

  describe('Basic Rendering', () => {
    it('should render the component without errors', () => {
      renderComponent();
      
      expect(screen.getByText('פרטי הפריט')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('פרטי יצירת קשר')).toBeInTheDocument();
    });

    it('should not show quality confirmation when no images are uploaded', () => {
      renderComponent();
      
      expect(screen.queryByText('וידאתי שהתמונות ברורות ומובנות')).not.toBeInTheDocument();
      expect(screen.queryByText('רוצים להעלות מנה נוספת?')).not.toBeInTheDocument();
    });
  });

  describe('Quality Confirmation Logic', () => {
    beforeEach(() => {
      // Mock having images uploaded
      defaultFormData.referenceImages = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
    });

    it('should show quality confirmation checkbox when images are uploaded', () => {
      renderComponent();
      
      expect(screen.getByText('וידאתי שהתמונות ברורות ומובנות')).toBeInTheDocument();
      expect(screen.getByText('תמונות ברורות ומובנות מבטיחות תוצאות טובות יותר')).toBeInTheDocument();
    });

    it('should show add another dish section when quality is confirmed', async () => {
      renderComponent();
      
      const qualityCheckbox = screen.getByRole('checkbox');
      fireEvent.click(qualityCheckbox);
      
      await waitFor(() => {
        expect(screen.getByText('רוצים להעלות מנה נוספת?')).toBeInTheDocument();
      });
      
      expect(screen.getByText('תוכלו להעלות מנה נוספת עם תמונות ופרטים נפרדים')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
    });

    it('should store quality confirmation in localStorage', () => {
      renderComponent();
      
      const qualityCheckbox = screen.getByRole('checkbox');
      fireEvent.click(qualityCheckbox);
      
      expect(window.localStorage.getItem('imageQualityConfirmed')).toBe('true');
    });
  });

  describe('Add Another Dish Functionality', () => {
    beforeEach(() => {
      // Mock having images uploaded
      defaultFormData.referenceImages = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
    });

    it('should call addDish when add another dish button is clicked', async () => {
      renderComponent();
      
      // Check quality confirmation
      const qualityCheckbox = screen.getByRole('checkbox');
      fireEvent.click(qualityCheckbox);
      
      // Wait for add button to appear and click it
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /הוספת מנה נוספת/i });
      fireEvent.click(addButton);
      
      expect(mockAddDish).toHaveBeenCalledTimes(1);
    });

    it('should reset quality confirmation when adding another dish', async () => {
      renderComponent();
      
      // Check quality confirmation
      const qualityCheckbox = screen.getByRole('checkbox');
      fireEvent.click(qualityCheckbox);
      
      // Verify localStorage was set
      expect(window.localStorage.getItem('imageQualityConfirmed')).toBe('true');
      
      // Click add another dish
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /הוספת מנה נוספת/i })).toBeInTheDocument();
      });
      
      const addButton = screen.getByRole('button', { name: /הוספת מנה נוספת/i });
      fireEvent.click(addButton);
      
      // Verify localStorage was reset
      expect(window.localStorage.getItem('imageQualityConfirmed')).toBe('false');
    });
  });

  describe('Form Fields', () => {
    it('should handle input changes correctly', () => {
      renderComponent();
      
      const itemNameInput = screen.getByLabelText('שם הפריט');
      fireEvent.change(itemNameInput, { target: { value: 'Pizza Margherita' } });
      
      expect(mockUpdateFormData).toHaveBeenCalledWith({ itemName: 'Pizza Margherita' });
    });

    it('should display error messages when provided', () => {
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
      
      // Check main Hebrew text elements
      expect(screen.getByText('פרטי הפריט')).toBeInTheDocument();
      expect(screen.getByText('העלאת תמונות')).toBeInTheDocument();
      expect(screen.getByText('פרטי יצירת קשר')).toBeInTheDocument();
      expect(screen.getByText('חשוב לדעת:')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('לדוגמה: פסטה קרבונרה, מוחיטו קלאסי')).toBeInTheDocument();
    });
  });
}); 