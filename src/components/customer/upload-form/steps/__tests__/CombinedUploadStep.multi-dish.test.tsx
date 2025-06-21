import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CombinedUploadStep from '../CombinedUploadStep';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

// Mock dependencies
vi.mock('@/components/ui/icon-input', () => ({
  IconInput: ({ label, value, onChange, error, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        {...props}
        value={value || ''}
        onChange={onChange}
        data-testid={`input-${props.name}`}
      />
      {error && <span data-testid={`error-${props.name}`}>{error}</span>}
    </div>
  ),
}));

vi.mock('@/components/ui/icon-textarea', () => ({
  IconTextarea: ({ label, value, onChange, error, ...props }: any) => (
    <div>
      <label>{label}</label>
      <textarea
        {...props}
        value={value || ''}
        onChange={onChange}
        data-testid={`textarea-${props.name}`}
      />
      {error && <span data-testid={`error-${props.name}`}>{error}</span>}
    </div>
  ),
}));

vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop }: any) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
      onClick: () => {},
    }),
    getInputProps: () => ({
      'data-testid': 'dropzone-input',
    }),
    isDragActive: false,
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NewItemFormProvider>
    {children}
  </NewItemFormProvider>
);

describe('CombinedUploadStep - Multi-Dish Feature', () => {
  const defaultProps = {
    errors: {},
    clearExternalErrors: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render with initial single dish', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText(/מנה 1: מנה חדשה/)).toBeInTheDocument();
      expect(screen.getByTestId('input-itemName')).toBeInTheDocument();
      expect(screen.getByTestId('input-itemType')).toBeInTheDocument();
    });

    it('should show dish accordion in expanded state initially', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Should show form fields (accordion is expanded)
      expect(screen.getByTestId('input-itemName')).toBeVisible();
      expect(screen.getByTestId('textarea-description')).toBeVisible();
    });

    it('should not show remove button for first dish', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.queryByText('הסר')).not.toBeInTheDocument();
    });
  });

  describe('Adding Dishes', () => {
    it('should add new dish when add button is clicked', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // First, add some images to show the add button
      const itemNameInput = screen.getByTestId('input-itemName');
      fireEvent.change(itemNameInput, { target: { value: 'פסטה' } });

      // Mock file upload to show add button
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });

      // Simulate adding images to make add button visible
      // This would normally be done through dropzone, but we'll simulate the state change
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Should show second dish accordion header
      await waitFor(() => {
        expect(screen.getByText(/מנה 2: מנה חדשה/)).toBeInTheDocument();
      });
    });

    it('should switch to new dish when added', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Fill first dish
      const itemNameInput = screen.getByTestId('input-itemName');
      fireEvent.change(itemNameInput, { target: { value: 'פסטה קרבונרה' } });

      // Add second dish (simulate button click)
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Form should be cleared for new dish
      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toHaveValue('');
      });
    });
  });

  describe('Dish Accordion Functionality', () => {
    it('should toggle dish accordion when header is clicked', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const dishHeader = screen.getByText(/מנה 1: מנה חדשה/).closest('button');
      expect(dishHeader).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(dishHeader!);

      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).not.toBeVisible();
      });

      // Click to expand again
      fireEvent.click(dishHeader!);

      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toBeVisible();
      });
    });

    it('should show chevron rotation when expanding/collapsing', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const chevron = screen.getByRole('button').querySelector('svg');
      expect(chevron).toHaveClass('rotate-180'); // Initially expanded

      const dishHeader = screen.getByText(/מנה 1: מנה חדשה/).closest('button');
      fireEvent.click(dishHeader!);

      expect(chevron).not.toHaveClass('rotate-180'); // Collapsed
    });

    it('should switch between dishes and load their data', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Fill first dish
      const itemNameInput = screen.getByTestId('input-itemName');
      fireEvent.change(itemNameInput, { target: { value: 'פסטה קרבונרה' } });

      const itemTypeInput = screen.getByTestId('input-itemType');
      fireEvent.change(itemTypeInput, { target: { value: 'מנה עיקרית' } });

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Fill second dish
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'סלט יווני' } });
        fireEvent.change(screen.getByTestId('input-itemType'), { target: { value: 'סלט' } });
      });

      // Switch back to first dish
      const firstDishHeader = screen.getByText(/מנה 1:/).closest('button');
      fireEvent.click(firstDishHeader!);

      // Should load first dish data
      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toHaveValue('פסטה קרבונרה');
        expect(screen.getByTestId('input-itemType')).toHaveValue('מנה עיקרית');
      });
    });
  });

  describe('Removing Dishes', () => {
    it('should show remove button for dishes beyond the first', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      await waitFor(() => {
        expect(screen.getByText('הסר')).toBeInTheDocument();
      });
    });

    it('should remove dish when remove button is clicked', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Should have second dish
      await waitFor(() => {
        expect(screen.getByText(/מנה 2:/)).toBeInTheDocument();
      });

      // Click remove button
      const removeButton = screen.getByText('הסר');
      fireEvent.click(removeButton);

      // Second dish should be removed
      await waitFor(() => {
        expect(screen.queryByText(/מנה 2:/)).not.toBeInTheDocument();
      });
    });

    it('should switch to remaining dish when active dish is removed', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Fill first dish
      fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'פסטה' } });

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Fill second dish
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'סלט' } });
      });

      // Remove second dish (which is currently active)
      const removeButton = screen.getByText('הסר');
      fireEvent.click(removeButton);

      // Should switch back to first dish data
      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toHaveValue('פסטה');
      });
    });

    it('should prevent removing the last remaining dish', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Should not show remove button for the only dish
      expect(screen.queryByText('הסר')).not.toBeInTheDocument();

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Remove second dish
      const removeButton = screen.getByText('הסר');
      fireEvent.click(removeButton);

      // Should still have first dish and no remove button
      expect(screen.getByText(/מנה 1:/)).toBeInTheDocument();
      expect(screen.queryByText('הסר')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation Integration', () => {
    it('should display validation errors', () => {
      const propsWithErrors = {
        ...defaultProps,
        errors: {
          itemName: 'שם הפריט הוא שדה חובה',
          itemType: 'סוג הפריט הוא שדה חובה',
        },
      };

      render(
        <TestWrapper>
          <CombinedUploadStep {...propsWithErrors} />
        </TestWrapper>
      );

      expect(screen.getByTestId('error-itemName')).toHaveTextContent('שם הפריט הוא שדה חובה');
      expect(screen.getByTestId('error-itemType')).toHaveTextContent('סוג הפריט הוא שדה חובה');
    });

    it('should clear errors when clearExternalErrors is called', () => {
      const clearExternalErrors = vi.fn();
      const propsWithErrors = {
        errors: { itemName: 'שגיאה' },
        clearExternalErrors,
      };

      render(
        <TestWrapper>
          <CombinedUploadStep {...propsWithErrors} />
        </TestWrapper>
      );

      const itemNameInput = screen.getByTestId('input-itemName');
      fireEvent.change(itemNameInput, { target: { value: 'פסטה' } });

      expect(clearExternalErrors).toHaveBeenCalled();
    });
  });

  describe('Item Type Suggestions', () => {
    it('should show item type suggestions when focused', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const itemTypeInput = screen.getByTestId('input-itemType');
      fireEvent.focus(itemTypeInput);

      await waitFor(() => {
        expect(screen.getByText('מנה')).toBeInTheDocument();
        expect(screen.getByText('משקה')).toBeInTheDocument();
        expect(screen.getByText('קינוח')).toBeInTheDocument();
      });
    });

    it('should filter suggestions based on input', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const itemTypeInput = screen.getByTestId('input-itemType');
      fireEvent.focus(itemTypeInput);
      fireEvent.change(itemTypeInput, { target: { value: 'מנ' } });

      await waitFor(() => {
        expect(screen.getByText('מנה')).toBeInTheDocument();
        expect(screen.queryByText('משקה')).not.toBeInTheDocument();
      });
    });

    it('should select suggestion when clicked', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const itemTypeInput = screen.getByTestId('input-itemType');
      fireEvent.focus(itemTypeInput);

      await waitFor(() => {
        const suggestion = screen.getByText('מנה');
        fireEvent.click(suggestion);
      });

      expect(itemTypeInput).toHaveValue('מנה');
    });
  });

  describe('Image Count Display', () => {
    it('should display image count for each dish', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Initially should show 0 images
      expect(screen.getByText('0 תמונות')).toBeInTheDocument();

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Both dishes should show image counts
      await waitFor(() => {
        const imageCounts = screen.getAllByText(/\d+ תמונות/);
        expect(imageCounts).toHaveLength(2);
      });
    });
  });

  describe('Data Persistence', () => {
    it('should persist dish data when switching between dishes', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Fill first dish
      fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'פסטה קרבונרה' } });
      fireEvent.change(screen.getByTestId('textarea-description'), { target: { value: 'פסטה עם ביצים' } });

      // Add second dish
      await waitFor(() => {
        const addButton = screen.queryByText(/הוסף מנה נוספת/);
        if (addButton) {
          fireEvent.click(addButton);
        }
      });

      // Fill second dish
      await waitFor(() => {
        fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'סלט יווני' } });
        fireEvent.change(screen.getByTestId('textarea-description'), { target: { value: 'סלט עם פטה' } });
      });

      // Switch back to first dish
      const firstDishHeader = screen.getByText(/מנה 1:/).closest('button');
      fireEvent.click(firstDishHeader!);

      // Data should be preserved
      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toHaveValue('פסטה קרבונרה');
        expect(screen.getByTestId('textarea-description')).toHaveValue('פסטה עם ביצים');
      });

      // Switch to second dish
      const secondDishHeader = screen.getByText(/מנה 2:/).closest('button');
      fireEvent.click(secondDishHeader!);

      // Second dish data should be preserved
      await waitFor(() => {
        expect(screen.getByTestId('input-itemName')).toHaveValue('סלט יווני');
        expect(screen.getByTestId('textarea-description')).toHaveValue('סלט עם פטה');
      });
    });

    it('should update dish header with item name', async () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      // Initially shows "מנה חדשה"
      expect(screen.getByText(/מנה 1: מנה חדשה/)).toBeInTheDocument();

      // Fill item name
      fireEvent.change(screen.getByTestId('input-itemName'), { target: { value: 'פסטה קרבונרה' } });

      // Header should update
      await waitFor(() => {
        expect(screen.getByText(/מנה 1: פסטה קרבונרה/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const dishHeader = screen.getByRole('button');
      expect(dishHeader).toBeInTheDocument();

      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      render(
        <TestWrapper>
          <CombinedUploadStep {...defaultProps} />
        </TestWrapper>
      );

      const itemNameInput = screen.getByTestId('input-itemName');
      itemNameInput.focus();
      expect(document.activeElement).toBe(itemNameInput);
    });
  });
}); 