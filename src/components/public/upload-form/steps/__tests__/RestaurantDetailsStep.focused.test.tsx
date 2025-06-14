import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import RestaurantDetailsStep from '../RestaurantDetailsStep';
import { NewItemFormProvider, useNewItemForm } from '../../../../../contexts/NewItemFormContext';

// Create a test component that uses the hook to verify functionality
const TestRestaurantForm: React.FC<{ onFormDataChange?: (data: any) => void }> = ({ onFormDataChange }) => {
  const { formData, updateFormData } = useNewItemForm();
  
  React.useEffect(() => {
    if (onFormDataChange) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange]);

  const mockProps = {
    errors: {},
    formData,
    updateFormData
  };

  return <RestaurantDetailsStep {...mockProps} />;
};

describe('RestaurantDetailsStep - Focused Component Tests', () => {
  describe('Business Registration Selection Core Functionality', () => {
    it('should render business registration question with asterisk', () => {
      render(
        <NewItemFormProvider>
          <TestRestaurantForm />
        </NewItemFormProvider>
      );

      expect(screen.getByText(/האם העסק שלכם כבר רשום במערכת\? \*/)).toBeInTheDocument();
      expect(screen.getByText('כן, העסק שלנו רשום')).toBeInTheDocument();
      expect(screen.getByText('לא, זו פעם ראשונה שלנו')).toBeInTheDocument();
    });

    it('should update form data when business selection changes', () => {
      const formDataSpy = vi.fn();
      
      render(
        <NewItemFormProvider>
          <TestRestaurantForm onFormDataChange={formDataSpy} />
        </NewItemFormProvider>
      );

      const existingBusinessButton = screen.getByText('כן, העסק שלנו רשום');
      fireEvent.click(existingBusinessButton);

      // Check that form data was updated
      expect(formDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewBusiness: false,
          isLead: false
        })
      );
    });

    it('should handle new business selection', () => {
      const formDataSpy = vi.fn();
      
      render(
        <NewItemFormProvider>
          <TestRestaurantForm onFormDataChange={formDataSpy} />
        </NewItemFormProvider>
      );

      const newBusinessButton = screen.getByText('לא, זו פעם ראשונה שלנו');
      fireEvent.click(newBusinessButton);

      expect(formDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          isNewBusiness: true,
          isLead: true
        })
      );
    });
  });

  describe('Form Field Basic Functionality', () => {
    it('should render all required form fields', () => {
      render(
        <NewItemFormProvider>
          <TestRestaurantForm />
        </NewItemFormProvider>
      );

      expect(screen.getByText(/שם המסעדה \/ העסק \*/)).toBeInTheDocument();
      expect(screen.getByText(/שם איש הקשר \*/)).toBeInTheDocument();
      expect(screen.getByText('כתובת אימייל')).toBeInTheDocument();
      expect(screen.getByText('מספר טלפון')).toBeInTheDocument();
    });

    it('should handle text input changes', () => {
      const formDataSpy = vi.fn();
      
      render(
        <NewItemFormProvider>
          <TestRestaurantForm onFormDataChange={formDataSpy} />
        </NewItemFormProvider>
      );

      const restaurantInput = screen.getByPlaceholderText('לדוגמה: מסעדת השף הקטן');
      fireEvent.change(restaurantInput, { target: { value: 'מסעדת הטעמים' } });

      expect(formDataSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          restaurantName: 'מסעדת הטעמים'
        })
      );
    });

    it('should have proper input types', () => {
      render(
        <NewItemFormProvider>
          <TestRestaurantForm />
        </NewItemFormProvider>
      );

      expect(screen.getByPlaceholderText('your@email.com')).toHaveAttribute('type', 'email');
      expect(screen.getByPlaceholderText('050-1234567')).toHaveAttribute('type', 'tel');
      expect(screen.getByPlaceholderText('לדוגמה: מסעדת השף הקטן')).toHaveAttribute('type', 'text');
      expect(screen.getByPlaceholderText('השם שלכם')).toHaveAttribute('type', 'text');
    });

    it('should have proper button types', () => {
      render(
        <NewItemFormProvider>
          <TestRestaurantForm />
        </NewItemFormProvider>
      );

      const buttons = screen.getAllByRole('button');
      const existingButton = buttons.find(btn => btn.textContent?.includes('כן, העסק שלנו רשום'));
      const newButton = buttons.find(btn => btn.textContent?.includes('לא, זו פעם ראשונה שלנו'));
      
      expect(existingButton).toHaveAttribute('type', 'button');
      expect(newButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Validation Integration', () => {
    it('should render with validation errors gracefully', () => {
      const errors = {
        isNewBusiness: 'חובה לבחור האם העסק רשום במערכת',
        restaurantName: 'חסר שם מסעדה'
      };

      render(
        <NewItemFormProvider>
          <RestaurantDetailsStep errors={errors} />
        </NewItemFormProvider>
      );

      expect(screen.getByText(/האם העסק שלכם כבר רשום במערכת\? \*/)).toBeInTheDocument();
    });

    it('should render without errors', () => {
      render(
        <NewItemFormProvider>
          <RestaurantDetailsStep errors={{}} />
        </NewItemFormProvider>
      );

      expect(screen.getByText(/האם העסק שלכם כבר רשום במערכת\? \*/)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper labels and ids', () => {
      render(
        <NewItemFormProvider>
          <TestRestaurantForm />
        </NewItemFormProvider>
      );

      const restaurantInput = screen.getByPlaceholderText('לדוגמה: מסעדת השף הקטן');
      const submitterInput = screen.getByPlaceholderText('השם שלכם');
      const emailInput = screen.getByPlaceholderText('your@email.com');
      const phoneInput = screen.getByPlaceholderText('050-1234567');

      expect(restaurantInput).toHaveAttribute('id', 'restaurantName');
      expect(submitterInput).toHaveAttribute('id', 'submitterName');
      expect(emailInput).toHaveAttribute('id', 'contactEmail');
      expect(phoneInput).toHaveAttribute('id', 'contactPhone');
    });
  });
}); 