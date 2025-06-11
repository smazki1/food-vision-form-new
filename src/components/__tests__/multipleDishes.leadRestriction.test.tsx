import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';
import CombinedUploadStep from '@/components/public/upload-form/steps/CombinedUploadStep';

// Mock dependencies
vi.mock('react-dropzone', () => ({
  useDropzone: () => ({
    getRootProps: () => ({}),
    getInputProps: () => ({}),
    isDragActive: false
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'test-url' } })
      }))
    }
  }
}));

// Test wrapper with form provider
const TestWrapper: React.FC<{ children: React.ReactNode; isLead?: boolean }> = ({ 
  children, 
  isLead = false 
}) => {
  return (
    <NewItemFormProvider>
      <div data-test-lead={isLead}>
        {children}
      </div>
    </NewItemFormProvider>
  );
};

// Mock component to set form data
const FormDataSetter: React.FC<{ isLead: boolean }> = ({ isLead }) => {
  const { updateFormData } = require('@/contexts/NewItemFormContext').useNewItemForm();
  
  React.useEffect(() => {
    updateFormData({ isLead });
  }, [isLead, updateFormData]);
  
  return null;
};

describe('Multiple Dishes Lead Restriction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add Another Dish Button Visibility', () => {
    it('should show "Add Another Dish" button for registered businesses (non-leads)', () => {
      render(
        <TestWrapper isLead={false}>
          <FormDataSetter isLead={false} />
          <CombinedUploadStep />
        </TestWrapper>
      );

      const addButton = screen.getByText('הוספת מנה נוספת');
      expect(addButton).toBeInTheDocument();
      expect(addButton).toBeVisible();
    });

    it('should hide "Add Another Dish" button for leads (first time businesses)', () => {
      render(
        <TestWrapper isLead={true}>
          <FormDataSetter isLead={true} />
          <CombinedUploadStep />
        </TestWrapper>
      );

      const addButton = screen.queryByText('הוספת מנה נוספת');
      expect(addButton).not.toBeInTheDocument();
    });

    it('should handle undefined isLead (default to showing button)', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep />
        </TestWrapper>
      );

      // When isLead is undefined/false, button should be visible
      const addButton = screen.getByText('הוספת מנה נוספת');
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Business Logic Consistency', () => {
    it('should maintain single dish functionality for leads', () => {
      render(
        <TestWrapper isLead={true}>
          <FormDataSetter isLead={true} />
          <CombinedUploadStep />
        </TestWrapper>
      );

      // Should still show the first dish section
      const dishSection = screen.getByText('העלאת מנות ומוצרים');
      expect(dishSection).toBeInTheDocument();
      
      // Should show first dish (numbered as "1")
      const firstDish = screen.getByText('1');
      expect(firstDish).toBeInTheDocument();
    });

    it('should allow multiple dishes for registered businesses', () => {
      render(
        <TestWrapper isLead={false}>
          <FormDataSetter isLead={false} />
          <CombinedUploadStep />
        </TestWrapper>
      );

      // Should show main section
      const dishSection = screen.getByText('העלאת מנות ומוצרים');
      expect(dishSection).toBeInTheDocument();
      
      // Should show add button
      const addButton = screen.getByText('הוספת מנה נוספת');
      expect(addButton).toBeInTheDocument();
    });
  });

  describe('Form Data Integration', () => {
    it('should correctly read isLead flag from form context', () => {
      const TestComponent = () => {
        const { formData } = require('@/contexts/NewItemFormContext').useNewItemForm();
        return (
          <div>
            <span data-testid="is-lead">{String(formData.isLead)}</span>
            <CombinedUploadStep />
          </div>
        );
      };

      render(
        <TestWrapper>
          <FormDataSetter isLead={true} />
          <TestComponent />
        </TestWrapper>
      );

      const isLeadValue = screen.getByTestId('is-lead');
      expect(isLeadValue).toHaveTextContent('true');
      
      // Button should be hidden
      const addButton = screen.queryByText('הוספת מנה נוספת');
      expect(addButton).not.toBeInTheDocument();
    });
  });
}); 