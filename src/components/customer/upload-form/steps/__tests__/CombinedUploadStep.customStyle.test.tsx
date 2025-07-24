import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';

// Mock lucide-react icons using factory function to avoid hoisting issues
vi.mock('lucide-react', () => {
  const mockIcon = ({ className, ...props }: any) => (
    <span className={className} {...props}>MockIcon</span>
  );
  
  return {
    UploadCloud: mockIcon,
    Trash2: mockIcon,
    AlertTriangle: mockIcon,
    Sparkles: mockIcon,
    FileImage: mockIcon,
    ChevronDown: mockIcon,
    Plus: mockIcon,
    Upload: mockIcon,
    X: mockIcon,
  };
});

import CombinedUploadStep from '../CombinedUploadStep';
import { useNewItemForm } from '@/contexts/NewItemFormContext';

// Mock the NewItemFormContext
vi.mock('@/contexts/NewItemFormContext');

// Mock UI components
vi.mock('@/components/ui/icon-input', () => ({
  IconInput: ({ label, value, onChange, ...props }: any) => (
    <div data-testid={`icon-input-${props.name}`}>
      <label>{label}</label>
      <input
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}));

vi.mock('@/components/ui/icon-textarea', () => ({
  IconTextarea: ({ label, value, onChange, ...props }: any) => (
    <div data-testid={`icon-textarea-${props.name}`}>
      <label>{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        {...props}
      />
    </div>
  )
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className}
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...props}
    />
  )
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept }: any) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone-root',
      onClick: () => {},
    }),
    getInputProps: () => ({
      'data-testid': 'dropzone-input',
      type: 'file',
      accept: accept?.join?.(',') || '',
    }),
    isDragActive: false,
    open: vi.fn(),
  }),
}));

describe('CombinedUploadStep - Custom Style Feature', () => {
  let mockFormData: any;
  let mockUpdateFormData: any;
  let mockAddDish: any;
  let mockUpdateDish: any;
  let mockGetDish: any;
  let mockRemoveDish: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup mock form data
    mockFormData = {
      itemName: 'Test Dish',
      itemType: 'dish',
      description: 'Test description',
      specialNotes: 'Test notes',
      referenceImages: [],
      dishes: [
        {
          id: '1',
          itemName: 'Test Dish',
          itemType: 'dish',
          description: 'Test description',
          specialNotes: 'Test notes',
          referenceImages: [],
          isCustomItemType: false,
          customItemType: '',
          qualityConfirmed: false,
        },
      ],
      restaurantName: 'Test Restaurant',
      submitterName: 'Test User',
      customStyle: undefined,
    };

    mockUpdateFormData = vi.fn();
    mockAddDish = vi.fn();
    mockUpdateDish = vi.fn();
    mockGetDish = vi.fn().mockReturnValue(mockFormData.dishes[0]);
    mockRemoveDish = vi.fn();

    // Setup the mock
    (useNewItemForm as any).mockReturnValue({
      formData: mockFormData,
      updateFormData: mockUpdateFormData,
      addDish: mockAddDish,
      updateDish: mockUpdateDish,
      getDish: mockGetDish,
      removeDish: mockRemoveDish,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Custom Style Toggle Functionality', () => {
    it('should render custom style toggle button when no custom style is active', () => {
      render(<CombinedUploadStep />);

      const toggleButton = screen.getByRole('button', { name: /הפעל סגנון/ });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('data-variant', 'outline');
    });

    it('should show "סגנון מותאם אישית" section header', () => {
      render(<CombinedUploadStep />);

      const header = screen.getByText('סגנון מותאם אישית');
      expect(header).toBeInTheDocument();
    });

    it('should toggle custom style section when button is clicked', async () => {
      const user = userEvent.setup();
      render(<CombinedUploadStep />);

      const toggleButton = screen.getByRole('button', { name: /הפעל סגנון/ });
      
      await user.click(toggleButton);

      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: '',
        },
      });
    });

    it('should show close button when custom style is active', () => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };

      render(<CombinedUploadStep />);

      const closeButton = screen.getByRole('button', { name: /סגור סגנון/ });
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('data-variant', 'default');
    });

    it('should disable custom style when close button is clicked', async () => {
      const user = userEvent.setup();
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };

      render(<CombinedUploadStep />);

      const closeButton = screen.getByRole('button', { name: /סגור סגנון/ });
      await user.click(closeButton);

      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: undefined,
      });
    });
  });

  describe('Custom Style Section Rendering', () => {
    beforeEach(() => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };
    });

    it('should render inspiration images section when custom style is active', () => {
      render(<CombinedUploadStep />);

      expect(screen.getByText('תמונות השראה')).toBeInTheDocument();
      expect(screen.getByText('העלה תמונות שמשקפות את הסגנון והאווירה הרצויים')).toBeInTheDocument();
    });

    it('should render branding materials section when custom style is active', () => {
      render(<CombinedUploadStep />);

      expect(screen.getByText(/חומרי מיתוג/)).toBeInTheDocument();
    });

    it('should render instructions section when custom style is active', () => {
      render(<CombinedUploadStep />);

      expect(screen.getByText('הוראות מיוחדות וחזון עיצובי')).toBeInTheDocument();
      expect(screen.getByText('תאר במילים את הסגנון, האווירה והתחושה שאתה רוצה להעביר')).toBeInTheDocument();
    });

    it('should not render custom style sections when disabled', () => {
      mockFormData.customStyle = undefined;
      render(<CombinedUploadStep />);

      expect(screen.queryByText('תמונות השראה')).not.toBeInTheDocument();
      expect(screen.queryByText(/חומרי מיתוג/)).not.toBeInTheDocument();
      expect(screen.queryByText('הוראות מיוחדות וחזון עיצובי')).not.toBeInTheDocument();
    });
  });

  describe('Instructions Text Area', () => {
    beforeEach(() => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };
    });

    it('should render instructions textarea', () => {
      render(<CombinedUploadStep />);

      const textarea = screen.getByPlaceholderText(/לדוגמה: 'אני רוצה סגנון מינימליסטי/);
      expect(textarea).toBeInTheDocument();
    });

    it('should handle instructions text change', async () => {
      const user = userEvent.setup();
      render(<CombinedUploadStep />);

      const textarea = screen.getByPlaceholderText(/לדוגמה: 'אני רוצה סגנון מינימליסטי/);
      const testInstructions = 'סגנון מודרני ונקי עם צבעים חמים';

      await user.type(textarea, testInstructions);

      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: {
          ...mockFormData.customStyle,
          instructions: expect.stringContaining(testInstructions.charAt(0)),
        },
      });
    });

    it('should display current instructions value', () => {
      const instructions = 'הוראות קיימות לסגנון';
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions,
      };

      render(<CombinedUploadStep />);

      const textarea = screen.getByDisplayValue(instructions);
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('File Upload Functionality', () => {
    beforeEach(() => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };
    });

    it('should show file count when files are uploaded', () => {
      mockFormData.customStyle = {
        inspirationImages: [
          new File(['img1'], 'img1.jpg', { type: 'image/jpeg' }),
          new File(['img2'], 'img2.jpg', { type: 'image/jpeg' }),
        ],
        brandingMaterials: [
          new File(['brand1'], 'brand1.pdf', { type: 'application/pdf' }),
        ],
        instructions: '',
      };

      render(<CombinedUploadStep />);

      expect(screen.getByText('נבחרו 2 תמונות השראה')).toBeInTheDocument();
      expect(screen.getByText('נבחרו 1 קבצי מיתוג')).toBeInTheDocument();
    });

    it('should handle dropzone rendering for inspiration images', () => {
      render(<CombinedUploadStep />);

      const dropzones = screen.getAllByTestId('dropzone-root');
      expect(dropzones.length).toBeGreaterThan(0);
    });

    it('should handle dropzone rendering for branding materials', () => {
      render(<CombinedUploadStep />);

      const dropzoneInputs = screen.getAllByTestId('dropzone-input');
      expect(dropzoneInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined customStyle gracefully', () => {
      mockFormData.customStyle = undefined;
      
      expect(() => render(<CombinedUploadStep />)).not.toThrow();
      expect(screen.getByRole('button', { name: /הפעל סגנון/ })).toBeInTheDocument();
    });

    it('should handle empty file arrays', () => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: 'test instructions',
      };

      render(<CombinedUploadStep />);

      expect(screen.getByDisplayValue('test instructions')).toBeInTheDocument();
      expect(screen.queryByText(/נבחרו.*תמונות השראה/)).not.toBeInTheDocument();
      expect(screen.queryByText(/נבחרו.*קבצי מיתוג/)).not.toBeInTheDocument();
    });

    it('should handle large file arrays', () => {
      const manyFiles = Array.from({ length: 10 }, (_, i) => 
        new File([`content${i}`], `file${i}.jpg`, { type: 'image/jpeg' })
      );

      mockFormData.customStyle = {
        inspirationImages: manyFiles.slice(0, 5),
        brandingMaterials: manyFiles.slice(5),
        instructions: '',
      };

      render(<CombinedUploadStep />);

      expect(screen.getByText('נבחרו 5 תמונות השראה')).toBeInTheDocument();
      expect(screen.getByText('נבחרו 5 קבצי מיתוג')).toBeInTheDocument();
    });

    it('should handle form data updates when customStyle is null', async () => {
      const user = userEvent.setup();
      mockFormData.customStyle = null;

      render(<CombinedUploadStep />);

      const toggleButton = screen.getByRole('button', { name: /הפעל סגנון/ });
      await user.click(toggleButton);

      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: '',
        },
      });
    });
  });

  describe('Integration with Form Context', () => {
    it('should call updateFormData when customStyle changes', async () => {
      const user = userEvent.setup();
      render(<CombinedUploadStep />);

      const toggleButton = screen.getByRole('button', { name: /הפעל סגנון/ });
      await user.click(toggleButton);

      expect(mockUpdateFormData).toHaveBeenCalledTimes(1);
      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: '',
        },
      });
    });

    it('should preserve other form data when updating customStyle', async () => {
      const user = userEvent.setup();
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };

      render(<CombinedUploadStep />);

      const textarea = screen.getByPlaceholderText(/לדוגמה: 'אני רוצה סגנון מינימליסטי/);
      await user.type(textarea, 'א');

      expect(mockUpdateFormData).toHaveBeenCalledWith({
        customStyle: {
          inspirationImages: [],
          brandingMaterials: [],
          instructions: 'א',
        },
      });
    });
  });

  describe('Accessibility and UX', () => {
    beforeEach(() => {
      mockFormData.customStyle = {
        inspirationImages: [],
        brandingMaterials: [],
        instructions: '',
      };
    });

    it('should have proper ARIA labels and roles', () => {
      render(<CombinedUploadStep />);

      const toggleButton = screen.getByRole('button', { name: /סגור סגנון/ });
      expect(toggleButton).toBeInTheDocument();

      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    it('should provide helpful placeholder text', () => {
      render(<CombinedUploadStep />);

      const placeholder = screen.getByPlaceholderText(/לדוגמה: 'אני רוצה סגנון מינימליסטי/);
      expect(placeholder).toBeInTheDocument();
    });

    it('should show helpful tips and guidance', () => {
      render(<CombinedUploadStep />);

      expect(screen.getByText('💡')).toBeInTheDocument();
      expect(screen.getByText(/ככל שתהיה יותר מפורט/)).toBeInTheDocument();
    });
  });
}); 