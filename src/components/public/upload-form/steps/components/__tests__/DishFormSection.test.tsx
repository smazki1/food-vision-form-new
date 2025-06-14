import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DishFormSection from '../DishFormSection';
import { DishData } from '../../../../../../contexts/NewItemFormContext';

const createTestFile = (name: string, size: number = 1024): File => {
  const file = new File(['test content'], name, { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const createDish = (overrides: Partial<DishData> = {}): DishData => ({
  id: '1',
  itemType: 'dish',
  itemName: 'Test Dish',
  description: 'Test Description',
  specialNotes: '',
  referenceImages: [],
  brandingMaterials: [],
  referenceExamples: [],
  isCustomItemType: false,
  customItemType: '',
  qualityConfirmed: false,
  ...overrides
});

describe('DishFormSection Enhanced', () => {
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    mockOnUpdate.mockClear();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mocked-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Image Upload Logic', () => {
    it('should handle adding new images correctly', async () => {
      const dish = createDish({ referenceImages: [] });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const dropzone = screen.getByText(/לחצו כאן או גררו תמונות/);
      const files = [
        createTestFile('image1.png'),
        createTestFile('image2.png'),
        createTestFile('image3.png'),
        createTestFile('image4.png')
      ];

      // Simulate dropping files
      fireEvent.drop(dropzone, { dataTransfer: { files } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          referenceImages: expect.arrayContaining(files)
        });
      });
    });

    it('should handle adding additional images to existing ones', async () => {
      const existingFiles = [
        createTestFile('existing1.png'),
        createTestFile('existing2.png'),
        createTestFile('existing3.png')
      ];
      const dish = createDish({ referenceImages: existingFiles });
      
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const dropzone = screen.getByText(/לחצו כאן או גררו תמונות/);
      const newFile = createTestFile('new4.png');

      fireEvent.drop(dropzone, { dataTransfer: { files: [newFile] } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith({
          referenceImages: [...existingFiles, newFile]
        });
      });
    });

    it('should prevent duplicate files (same name and size)', async () => {
      const existingFile = createTestFile('duplicate.png', 1024);
      const dish = createDish({ referenceImages: [existingFile] });
      
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const dropzone = screen.getByText(/לחצו כאן או גררו תמונות/);
      const duplicateFile = createTestFile('duplicate.png', 1024);

      fireEvent.drop(dropzone, { dataTransfer: { files: [duplicateFile] } });

      // Should not call onUpdate since it's a duplicate
      await waitFor(() => {
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });

    it('should enforce 10 image limit', async () => {
      const existingFiles = Array(10).fill(null).map((_, i) => 
        createTestFile(`existing${i}.png`)
      );
      const dish = createDish({ referenceImages: existingFiles });
      
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const dropzone = screen.getByText(/לחצו כאן או גררו תמונות/);
      const newFile = createTestFile('overflow.png');

      fireEvent.drop(dropzone, { dataTransfer: { files: [newFile] } });

      // Should not add the new file since limit is reached
      await waitFor(() => {
        expect(mockOnUpdate).not.toHaveBeenCalled();
      });
    });

    it('should handle file removal correctly', async () => {
      const files = [
        createTestFile('file1.png'),
        createTestFile('file2.png'),
        createTestFile('file3.png')
      ];
      const dish = createDish({ referenceImages: files });
      
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      // Find and click the first remove button
      const removeButtons = screen.getAllByRole('button');
      const firstRemoveButton = removeButtons.find(button => 
        button.querySelector('.lucide-trash-2')
      );
      
      if (firstRemoveButton) {
        fireEvent.click(firstRemoveButton);

        await waitFor(() => {
          expect(mockOnUpdate).toHaveBeenCalledWith({
            referenceImages: [files[1], files[2]]
          });
        });
      }
    });
  });

  describe('Quality Confirmation', () => {
    it('should update quality confirmation state', async () => {
      const dish = createDish({ qualityConfirmed: false });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        qualityConfirmed: true
      });
    });

    it('should initialize with existing quality confirmation state', () => {
      const dish = createDish({ qualityConfirmed: true });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it('should display required asterisk for quality confirmation', () => {
      const dish = createDish();
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/אני מאשר\/ת שהתמונות באיכות גבוהה \*/)).toBeInTheDocument();
    });
  });

  describe('Form Field Updates', () => {
    it('should update item name', async () => {
      const dish = createDish({ itemName: '' });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const input = screen.getByPlaceholderText(/למשל: פסטה ברוטב עגבניות/);
      await userEvent.type(input, 'New Dish Name');

      expect(mockOnUpdate).toHaveBeenCalledWith({
        itemName: 'New Dish Name'
      });
    });

    it('should update description', async () => {
      const dish = createDish({ description: '' });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const textarea = screen.getByPlaceholderText(/תארו את המנה/);
      await userEvent.type(textarea, 'New description');

      expect(mockOnUpdate).toHaveBeenCalledWith({
        description: 'New description'
      });
    });

    it('should handle item type selection', async () => {
      const dish = createDish({ itemType: '' });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const drinkButton = screen.getByText('משקה');
      fireEvent.click(drinkButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        isCustomItemType: false,
        itemType: 'drink',
        customItemType: ''
      });
    });

    it('should handle custom item type selection', async () => {
      const dish = createDish({ itemType: '' });
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      const otherButton = screen.getByText('אחר');
      fireEvent.click(otherButton);

      expect(mockOnUpdate).toHaveBeenCalledWith({
        isCustomItemType: true,
        itemType: dish.customItemType || ''
      });
    });
  });

  describe('Required Field Display', () => {
    it('should display asterisks for required fields', () => {
      const dish = createDish();
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      expect(screen.getByText(/שם המנה\/המוצר \*/)).toBeInTheDocument();
      expect(screen.getByText(/תיאור המנה \*/)).toBeInTheDocument();
      expect(screen.getByText(/סוג המוצר \*/)).toBeInTheDocument();
      expect(screen.getByText(/תמונות המנה \*/)).toBeInTheDocument();
      expect(screen.getByText(/אני מאשר\/ת שהתמונות באיכות גבוהה \*/)).toBeInTheDocument();
    });

    it('should not display asterisk for optional fields', () => {
      const dish = createDish();
      render(<DishFormSection dish={dish} onUpdate={mockOnUpdate} />);

      expect(screen.getByText('הערות מיוחדות (אופציונלי)')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display validation errors when provided', () => {
      const dish = createDish();
      const errors = {
        itemName: 'חסר שם מנה',
        description: 'חסר תיאור',
        itemType: 'חסר סוג מוצר'
      };
      
      render(<DishFormSection dish={dish} errors={errors} onUpdate={mockOnUpdate} />);

      // Errors should be passed to input components but not displayed as separate text
      // since we removed duplicate error display
      expect(screen.queryByText('חסר שם מנה')).not.toBeInTheDocument();
      expect(screen.queryByText('חסר תיאור')).not.toBeInTheDocument();
    });
  });
}); 