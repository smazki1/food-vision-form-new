import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext';
import PaymentSummaryStep from '../steps/PaymentSummaryStep';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock window.location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock form data
const mockFormData = {
  restaurantName: 'מסעדת בדיקה',
  submitterName: 'יוסי כהן',
  phone: '0501234567',
  email: 'test@example.com',
  selectedCategory: 'delivery',
  selectedStyle: 'white-bg',
  customStyle: '',
  dishes: [
    {
      id: '1',
      itemName: 'פסטה ברוטב עגבניות',
      itemType: 'מנה',
      description: 'פסטה טרייה עם רוטב עגבניות ביתי',
      referenceImages: []
    }
  ]
};

// Custom provider that sets initial data
const TestFormProvider = ({ children, data }: { children: React.ReactNode; data?: any }) => {
  return (
    <NewItemFormProvider>
      <TestFormDataSetter data={data}>
        {children}
      </TestFormDataSetter>
    </NewItemFormProvider>
  );
};

// Component to set form data after context is available
const TestFormDataSetter = ({ children, data }: { children: React.ReactNode; data?: any }) => {
  const { updateFormData } = useNewItemForm();
  
  React.useEffect(() => {
    if (data) {
      updateFormData(data);
    }
  }, [data, updateFormData]);
  
  return <>{children}</>;
};

const createWrapper = (data = mockFormData) => ({ children }: { children: React.ReactNode }) => (
  <TestFormProvider data={data}>
    {children}
  </TestFormProvider>
);

describe('PaymentSummaryStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  describe('Component Rendering', () => {
    it('should render payment summary with correct information', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('סיכום וביצוע תשלום')).toBeInTheDocument();
      expect(screen.getByText('מסעדת בדיקה')).toBeInTheDocument();
      expect(screen.getByText('יוסי כהן')).toBeInTheDocument();
      expect(screen.getByText('0501234567')).toBeInTheDocument();
      expect(screen.getByText('1 מנות')).toBeInTheDocument();
    });

    it('should display category and style information', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('אפליקציות משלוח')).toBeInTheDocument();
      expect(screen.getByText('רקע לבן')).toBeInTheDocument();
    });

         it('should show custom style when selected', () => {
       const customFormData = {
         ...mockFormData,
         customStyle: 'סגנון מיוחד'
       };
       
       const wrapper = createWrapper(customFormData);

       render(
         <PaymentSummaryStep 
           errors={{}} 
           clearErrors={vi.fn()} 
         />, 
         { wrapper }
       );

      expect(screen.getByText('סגנון מותאם אישית')).toBeInTheDocument();
    });

    it('should display payment button with correct price', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('בצע תשלום - 249₪')).toBeInTheDocument();
    });

    it('should show what you get section', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('מה תקבלו')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקצועיות לכל המנות')).toBeInTheDocument();
      expect(screen.getByText('עיצוב מותאם לשימוש שלכם')).toBeInTheDocument();
    });

    it('should show timeline information', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('מה קורה הלאה?')).toBeInTheDocument();
      expect(screen.getByText(/תוך 24 שעות/)).toBeInTheDocument();
      expect(screen.getByText(/תוך 2-3 ימי עבודה/)).toBeInTheDocument();
    });

    it('should show guarantee section', () => {
      const wrapper = createWrapper();
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.getByText('הערבות שלנו')).toBeInTheDocument();
      expect(screen.getByText('החזר כספי מלא אם לא מרוצים')).toBeInTheDocument();
    });
  });

  describe('Previous Button Functionality', () => {
    it('should render previous button when onPrevious is provided', () => {
      const onPrevious = vi.fn();
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
          onPrevious={onPrevious}
        />, 
        { wrapper }
      );

      expect(screen.getByText('חזור')).toBeInTheDocument();
    });

    it('should call onPrevious when previous button is clicked', () => {
      const onPrevious = vi.fn();
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
          onPrevious={onPrevious}
        />, 
        { wrapper }
      );

      fireEvent.click(screen.getByText('חזור'));
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });

    it('should not render previous button when onPrevious is not provided', () => {
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      expect(screen.queryByText('חזור')).not.toBeInTheDocument();
    });
  });

  describe('Submit Functionality', () => {
    it('should call onSubmit when payment button is clicked', async () => {
      const onSubmit = vi.fn().mockResolvedValue(true);
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
          onSubmit={onSubmit}
        />, 
        { wrapper }
      );

      fireEvent.click(screen.getByText('בצע תשלום - 249₪'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should use fallback submission when onSubmit is not provided', async () => {
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper }
      );

      fireEvent.click(screen.getByText('בצע תשלום - 249₪'));
      
      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('מעבד את ההגשה...');
      });

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(toast.success).toHaveBeenCalledWith('ההזמנה נשלחה בהצלחה!');
      expect(mockLocation.href).toBe('/thank-you');
    });

    it('should handle async onSubmit function', async () => {
      const onSubmit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(true), 100))
      );
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
          onSubmit={onSubmit}
        />, 
        { wrapper }
      );

      fireEvent.click(screen.getByText('בצע תשלום - 249₪'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle onSubmit rejection gracefully', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'));
      const wrapper = createWrapper();
      
      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
          onSubmit={onSubmit}
        />, 
        { wrapper }
      );

      fireEvent.click(screen.getByText('בצע תשלום - 249₪'));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
      });

      // Component should not crash on rejection
      expect(screen.getByText('בצע תשלום - 249₪')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dishes array', () => {
      const emptyDishesData = {
        ...mockFormData,
        dishes: []
      };
      
      const EmptyWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewItemFormProvider initialData={emptyDishesData}>
          {children}
        </NewItemFormProvider>
      );

      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper: EmptyWrapper }
      );

      expect(screen.getByText('0 מנות')).toBeInTheDocument();
    });

    it('should handle missing category', () => {
      const noCategoryData = {
        ...mockFormData,
        selectedCategory: ''
      };
      
      const NoCategoryWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewItemFormProvider initialData={noCategoryData}>
          {children}
        </NewItemFormProvider>
      );

      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper: NoCategoryWrapper }
      );

      // Should not crash and show empty category
      expect(screen.getByText('סיכום וביצוע תשלום')).toBeInTheDocument();
    });

    it('should handle missing style', () => {
      const noStyleData = {
        ...mockFormData,
        selectedStyle: ''
      };
      
      const NoStyleWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewItemFormProvider initialData={noStyleData}>
          {children}
        </NewItemFormProvider>
      );

      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper: NoStyleWrapper }
      );

      // Should not crash and show empty style
      expect(screen.getByText('סיכום וביצוע תשלום')).toBeInTheDocument();
    });

    it('should handle very long restaurant names', () => {
      const longNameData = {
        ...mockFormData,
        restaurantName: 'מ'.repeat(100)
      };
      
      const LongNameWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewItemFormProvider initialData={longNameData}>
          {children}
        </NewItemFormProvider>
      );

      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper: LongNameWrapper }
      );

      expect(screen.getByText('מ'.repeat(100))).toBeInTheDocument();
    });

    it('should handle multiple dishes', () => {
      const multipleDishesData = {
        ...mockFormData,
        dishes: [
          { id: '1', itemName: 'מנה 1', itemType: 'מנה', description: '', referenceImages: [] },
          { id: '2', itemName: 'מנה 2', itemType: 'מנה', description: '', referenceImages: [] },
          { id: '3', itemName: 'מנה 3', itemType: 'מנה', description: '', referenceImages: [] }
        ]
      };
      
      const MultipleWrapper = ({ children }: { children: React.ReactNode }) => (
        <NewItemFormProvider initialData={multipleDishesData}>
          {children}
        </NewItemFormProvider>
      );

      render(
        <PaymentSummaryStep 
          errors={{}} 
          clearErrors={vi.fn()} 
        />, 
        { wrapper: MultipleWrapper }
      );

      expect(screen.getByText('3 מנות')).toBeInTheDocument();
    });
  });

  describe('Category Name Mapping', () => {
    const testCases = [
      { id: 'delivery', expected: 'אפליקציות משלוח' },
      { id: 'social', expected: 'רשתות חברתיות' },
      { id: 'menu', expected: 'תפריטים ומסכי הזמנה' },
      { id: 'marketing', expected: 'פרסום ושיווק' },
      { id: 'all', expected: 'כל הסגנונות' },
      { id: 'unknown', expected: 'unknown' }
    ];

    testCases.forEach(({ id, expected }) => {
      it(`should map category ${id} to ${expected}`, () => {
        const categoryData = {
          ...mockFormData,
          selectedCategory: id
        };
        
        const CategoryWrapper = ({ children }: { children: React.ReactNode }) => (
          <NewItemFormProvider initialData={categoryData}>
            {children}
          </NewItemFormProvider>
        );

        render(
          <PaymentSummaryStep 
            errors={{}} 
            clearErrors={vi.fn()} 
          />, 
          { wrapper: CategoryWrapper }
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });

  describe('Style Name Mapping', () => {
    const testCases = [
      { id: 'white-bg', expected: 'רקע לבן' },
      { id: 'dark-bg', expected: 'רקע כהה' },
      { id: 'wood-bg', expected: 'רקע עץ' },
      { id: 'colorful-bg', expected: 'רקע צבעוני' },
      { id: 'instagram-square', expected: 'Instagram מרובע' },
      { id: 'unknown-style', expected: 'unknown-style' }
    ];

    testCases.forEach(({ id, expected }) => {
      it(`should map style ${id} to ${expected}`, () => {
        const styleData = {
          ...mockFormData,
          selectedStyle: id
        };
        
        const StyleWrapper = ({ children }: { children: React.ReactNode }) => (
          <NewItemFormProvider initialData={styleData}>
            {children}
          </NewItemFormProvider>
        );

        render(
          <PaymentSummaryStep 
            errors={{}} 
            clearErrors={vi.fn()} 
          />, 
          { wrapper: StyleWrapper }
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });
  });
}); 