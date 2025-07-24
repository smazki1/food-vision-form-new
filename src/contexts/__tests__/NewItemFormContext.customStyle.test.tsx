import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { NewItemFormProvider, useNewItemForm } from '../NewItemFormContext';

describe('NewItemFormContext - Custom Style Integration', () => {
  let TestComponent: React.FC;

  beforeEach(() => {
    vi.clearAllMocks();

    TestComponent = () => {
      const { formData, updateFormData } = useNewItemForm();

      const handleToggleCustomStyle = () => {
        if (formData.customStyle) {
          updateFormData({ customStyle: undefined });
        } else {
          updateFormData({
            customStyle: {
              inspirationImages: [],
              brandingMaterials: [],
              instructions: '',
            },
          });
        }
      };

      const handleCustomStyleChange = (field: string, value: any) => {
        if (formData.customStyle) {
          updateFormData({
            customStyle: {
              ...formData.customStyle,
              [field]: value,
            },
          });
        }
      };

      return (
        <div>
          <div data-testid="custom-style-status">
            {formData.customStyle ? 'enabled' : 'disabled'}
          </div>
          
          <button
            data-testid="toggle-custom-style"
            onClick={handleToggleCustomStyle}
          >
            Toggle Custom Style
          </button>

          {formData.customStyle && (
            <div data-testid="custom-style-section">
              <input
                data-testid="instructions-input"
                value={formData.customStyle.instructions}
                onChange={(e) => handleCustomStyleChange('instructions', e.target.value)}
                placeholder="Custom style instructions"
              />
              
              <div data-testid="inspiration-count">
                Inspiration Images: {formData.customStyle.inspirationImages.length}
              </div>
              
              <div data-testid="branding-count">
                Branding Materials: {formData.customStyle.brandingMaterials.length}
              </div>

              <button
                data-testid="add-inspiration"
                onClick={() => {
                  const mockFile = new File(['inspiration'], 'inspiration.jpg', { type: 'image/jpeg' });
                  handleCustomStyleChange('inspirationImages', [
                    ...formData.customStyle!.inspirationImages,
                    mockFile,
                  ]);
                }}
              >
                Add Inspiration Image
              </button>

              <button
                data-testid="add-branding"
                onClick={() => {
                  const mockFile = new File(['branding'], 'branding.pdf', { type: 'application/pdf' });
                  handleCustomStyleChange('brandingMaterials', [
                    ...formData.customStyle!.brandingMaterials,
                    mockFile,
                  ]);
                }}
              >
                Add Branding Material
              </button>
            </div>
          )}

          <div data-testid="form-data-debug">
            {JSON.stringify({
              hasCustomStyle: !!formData.customStyle,
              instructionsLength: formData.customStyle?.instructions?.length || 0,
              inspirationCount: formData.customStyle?.inspirationImages?.length || 0,
              brandingCount: formData.customStyle?.brandingMaterials?.length || 0,
            })}
          </div>
        </div>
      );
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Custom Style State Management', () => {
    it('should initialize without custom style data', () => {
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      expect(screen.getByTestId('custom-style-status')).toHaveTextContent('disabled');
      expect(screen.queryByTestId('custom-style-section')).not.toBeInTheDocument();
    });

    it('should enable custom style when toggled', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      const toggleButton = screen.getByTestId('toggle-custom-style');
      await user.click(toggleButton);

      expect(screen.getByTestId('custom-style-status')).toHaveTextContent('enabled');
      expect(screen.getByTestId('custom-style-section')).toBeInTheDocument();
      expect(screen.getByTestId('instructions-input')).toBeInTheDocument();
    });

    it('should disable custom style when toggled off', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable first
      const toggleButton = screen.getByTestId('toggle-custom-style');
      await user.click(toggleButton);
      expect(screen.getByTestId('custom-style-status')).toHaveTextContent('enabled');

      // Disable
      await user.click(toggleButton);
      expect(screen.getByTestId('custom-style-status')).toHaveTextContent('disabled');
      expect(screen.queryByTestId('custom-style-section')).not.toBeInTheDocument();
    });

    it('should maintain custom style data structure', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable custom style
      const toggleButton = screen.getByTestId('toggle-custom-style');
      await user.click(toggleButton);

      // Check initial structure
      expect(screen.getByTestId('inspiration-count')).toHaveTextContent('Inspiration Images: 0');
      expect(screen.getByTestId('branding-count')).toHaveTextContent('Branding Materials: 0');
      expect(screen.getByTestId('instructions-input')).toHaveValue('');
    });
  });

  describe('Custom Style Data Updates', () => {
    it('should update instructions text', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable custom style
      await user.click(screen.getByTestId('toggle-custom-style'));

      // Update instructions
      const instructionsInput = screen.getByTestId('instructions-input');
      await user.type(instructionsInput, 'Modern minimalist style');

      expect(instructionsInput).toHaveValue('Modern minimalist style');
      
      // Check debug data
      const debugData = JSON.parse(screen.getByTestId('form-data-debug').textContent!);
      expect(debugData.instructionsLength).toBe('Modern minimalist style'.length);
    });

    it('should add inspiration images', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable custom style
      await user.click(screen.getByTestId('toggle-custom-style'));

      // Add inspiration images
      const addInspirationButton = screen.getByTestId('add-inspiration');
      await user.click(addInspirationButton);
      await user.click(addInspirationButton);

      expect(screen.getByTestId('inspiration-count')).toHaveTextContent('Inspiration Images: 2');
      
      // Check debug data
      const debugData = JSON.parse(screen.getByTestId('form-data-debug').textContent!);
      expect(debugData.inspirationCount).toBe(2);
    });

    it('should add branding materials', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable custom style
      await user.click(screen.getByTestId('toggle-custom-style'));

      // Add branding materials
      const addBrandingButton = screen.getByTestId('add-branding');
      await user.click(addBrandingButton);
      await user.click(addBrandingButton);
      await user.click(addBrandingButton);

      expect(screen.getByTestId('branding-count')).toHaveTextContent('Branding Materials: 3');
      
      // Check debug data
      const debugData = JSON.parse(screen.getByTestId('form-data-debug').textContent!);
      expect(debugData.brandingCount).toBe(3);
    });

    it('should handle multiple field updates simultaneously', async () => {
      const user = userEvent.setup();
      render(
        <NewItemFormProvider>
          <TestComponent />
        </NewItemFormProvider>
      );

      // Enable custom style
      await user.click(screen.getByTestId('toggle-custom-style'));

      // Update multiple fields
      const instructionsInput = screen.getByTestId('instructions-input');
      await user.type(instructionsInput, 'Complex custom style');
      
      await user.click(screen.getByTestId('add-inspiration'));
      await user.click(screen.getByTestId('add-inspiration'));
      await user.click(screen.getByTestId('add-branding'));

      // Verify all updates
      expect(instructionsInput).toHaveValue('Complex custom style');
      expect(screen.getByTestId('inspiration-count')).toHaveTextContent('Inspiration Images: 2');
      expect(screen.getByTestId('branding-count')).toHaveTextContent('Branding Materials: 1');

      // Check debug data
      const debugData = JSON.parse(screen.getByTestId('form-data-debug').textContent!);
      expect(debugData.hasCustomStyle).toBe(true);
      expect(debugData.instructionsLength).toBe('Complex custom style'.length);
      expect(debugData.inspirationCount).toBe(2);
      expect(debugData.brandingCount).toBe(1);
    });
  });

  describe('Edge Cases and Data Integrity', () => {
    it('should preserve custom style data when other form fields change', async () => {
      const user = userEvent.setup();

      const TestComponentWithOtherFields = () => {
        const { formData, updateFormData } = useNewItemForm();

        return (
          <div>
            <input
              data-testid="item-name-input"
              value={formData.itemName}
              onChange={(e) => updateFormData({ itemName: e.target.value })}
              placeholder="Item name"
            />
            
            <button
              data-testid="enable-custom-style"
              onClick={() => updateFormData({
                customStyle: {
                  inspirationImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
                  brandingMaterials: [],
                  instructions: 'Test instructions',
                },
              })}
            >
              Enable Custom Style
            </button>

            <div data-testid="custom-style-preserved">
              {formData.customStyle ? 'preserved' : 'lost'}
            </div>

            <div data-testid="instructions-preserved">
              {formData.customStyle?.instructions || 'no-instructions'}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <TestComponentWithOtherFields />
        </NewItemFormProvider>
      );

      // Set custom style data
      await user.click(screen.getByTestId('enable-custom-style'));
      expect(screen.getByTestId('custom-style-preserved')).toHaveTextContent('preserved');
      expect(screen.getByTestId('instructions-preserved')).toHaveTextContent('Test instructions');

      // Update other field
      const itemNameInput = screen.getByTestId('item-name-input');
      await user.type(itemNameInput, 'Changed item name');

      // Custom style should be preserved
      expect(screen.getByTestId('custom-style-preserved')).toHaveTextContent('preserved');
      expect(screen.getByTestId('instructions-preserved')).toHaveTextContent('Test instructions');
    });

    it('should handle undefined/null custom style gracefully', () => {
      const TestComponentWithNullHandling = () => {
        const { formData, updateFormData } = useNewItemForm();

        return (
          <div>
            <button
              data-testid="set-null-custom-style"
              onClick={() => updateFormData({ customStyle: null as any })}
            >
              Set Null Custom Style
            </button>

            <button
              data-testid="set-undefined-custom-style"
              onClick={() => updateFormData({ customStyle: undefined })}
            >
              Set Undefined Custom Style
            </button>

            <div data-testid="custom-style-state">
              {formData.customStyle === null ? 'null' : 
               formData.customStyle === undefined ? 'undefined' : 'defined'}
            </div>

            <div data-testid="safe-access-test">
              {formData.customStyle?.instructions?.length || 0}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <TestComponentWithNullHandling />
        </NewItemFormProvider>
      );

      // Should handle null
      fireEvent.click(screen.getByTestId('set-null-custom-style'));
      expect(screen.getByTestId('custom-style-state')).toHaveTextContent('null');
      expect(screen.getByTestId('safe-access-test')).toHaveTextContent('0');

      // Should handle undefined
      fireEvent.click(screen.getByTestId('set-undefined-custom-style'));
      expect(screen.getByTestId('custom-style-state')).toHaveTextContent('undefined');
      expect(screen.getByTestId('safe-access-test')).toHaveTextContent('0');
    });

    it('should maintain file object references', async () => {
      const user = userEvent.setup();

      const TestComponentWithFileRefs = () => {
        const { formData, updateFormData } = useNewItemForm();

        const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });

        return (
          <div>
            <button
              data-testid="add-test-file"
              onClick={() => updateFormData({
                customStyle: {
                  inspirationImages: [testFile],
                  brandingMaterials: [],
                  instructions: '',
                },
              })}
            >
              Add Test File
            </button>

            <div data-testid="file-name">
              {formData.customStyle?.inspirationImages[0]?.name || 'no-file'}
            </div>

            <div data-testid="file-type">
              {formData.customStyle?.inspirationImages[0]?.type || 'no-type'}
            </div>

            <div data-testid="file-size">
              {formData.customStyle?.inspirationImages[0]?.size || 0}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <TestComponentWithFileRefs />
        </NewItemFormProvider>
      );

      await user.click(screen.getByTestId('add-test-file'));

      expect(screen.getByTestId('file-name')).toHaveTextContent('test.jpg');
      expect(screen.getByTestId('file-type')).toHaveTextContent('image/jpeg');
      expect(screen.getByTestId('file-size')).toHaveTextContent('12'); // 'test content'.length
    });
  });

  describe('Integration with Existing Form Data', () => {
    it('should work alongside dish management', async () => {
      const user = userEvent.setup();

      const TestComponentWithDishes = () => {
        const { formData, updateFormData, addDish } = useNewItemForm();

        return (
          <div>
            <button
              data-testid="add-dish"
              onClick={() => addDish()}
            >
              Add Dish
            </button>

            <button
              data-testid="enable-custom-style"
              onClick={() => updateFormData({
                customStyle: {
                  inspirationImages: [],
                  brandingMaterials: [],
                  instructions: 'Style for all dishes',
                },
              })}
            >
              Enable Custom Style
            </button>

            <div data-testid="dish-count">
              Dishes: {formData.dishes.length}
            </div>

            <div data-testid="custom-style-instructions">
              {formData.customStyle?.instructions || 'no-style'}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <TestComponentWithDishes />
        </NewItemFormProvider>
      );

      // Add dishes and custom style
      await user.click(screen.getByTestId('add-dish'));
      await user.click(screen.getByTestId('add-dish'));
      await user.click(screen.getByTestId('enable-custom-style'));

      expect(screen.getByTestId('dish-count')).toHaveTextContent('Dishes: 3'); // Initial + 2 added
      expect(screen.getByTestId('custom-style-instructions')).toHaveTextContent('Style for all dishes');
    });

    it('should reset custom style data on form reset', () => {
      const TestComponentWithReset = () => {
        const { formData, updateFormData, resetFormData } = useNewItemForm();

        return (
          <div>
            <button
              data-testid="set-custom-style"
              onClick={() => updateFormData({
                customStyle: {
                  inspirationImages: [new File(['test'], 'test.jpg', { type: 'image/jpeg' })],
                  brandingMaterials: [new File(['brand'], 'brand.pdf', { type: 'application/pdf' })],
                  instructions: 'Will be reset',
                },
              })}
            >
              Set Custom Style
            </button>

            <button
              data-testid="reset-form"
              onClick={() => resetFormData()}
            >
              Reset Form
            </button>

            <div data-testid="custom-style-exists">
              {formData.customStyle ? 'exists' : 'none'}
            </div>
          </div>
        );
      };

      render(
        <NewItemFormProvider>
          <TestComponentWithReset />
        </NewItemFormProvider>
      );

      // Set custom style
      fireEvent.click(screen.getByTestId('set-custom-style'));
      expect(screen.getByTestId('custom-style-exists')).toHaveTextContent('exists');

      // Reset form
      fireEvent.click(screen.getByTestId('reset-form'));
      expect(screen.getByTestId('custom-style-exists')).toHaveTextContent('none');
    });
  });
}); 