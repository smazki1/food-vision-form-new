
/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useUnifiedFormValidation } from './useUnifiedFormValidation';
import { useNewItemForm, NewItemFormData } from '../contexts/NewItemFormContext';
import * as formValidationUtils from '../utils/publicFormValidation';

// Mock the validation utility functions
vi.mock('../utils/publicFormValidation', () => ({
  validateRestaurantDetailsStep: vi.fn(),
  validateItemDetailsStep: vi.fn(),
  validateImageUploadStep: vi.fn(),
  validateReviewStep: vi.fn(),
}));

// Mock the NewItemFormContext hook
vi.mock('../contexts/NewItemFormContext', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    useNewItemForm: vi.fn(), // This will be overridden in beforeEach
  };
});

const initialMockFormData: NewItemFormData = {
  restaurantName: '',
  submitterName: '',
  itemName: '',
  itemType: 'dish',
  description: '',
  specialNotes: '',
  referenceImages: [],
};

describe('useUnifiedFormValidation', () => {
  let mockUpdateFormData: ReturnType<typeof vi.fn>;
  let mockResetFormData: ReturnType<typeof vi.fn>;
  let currentFormData: NewItemFormData;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateFormData = vi.fn();
    mockResetFormData = vi.fn();
    // Simulate the formData that would be available in the hook via useNewItemForm
    currentFormData = { ...initialMockFormData }; 
    (useNewItemForm as vi.Mock).mockReturnValue({
      formData: currentFormData, 
      updateFormData: mockUpdateFormData,
      resetFormData: mockResetFormData,
    });

    // Reset and mock default return values for validation functions
    (formValidationUtils.validateRestaurantDetailsStep as vi.Mock).mockReturnValue({});
    (formValidationUtils.validateItemDetailsStep as vi.Mock).mockReturnValue({});
    (formValidationUtils.validateImageUploadStep as vi.Mock).mockReturnValue({});
    (formValidationUtils.validateReviewStep as vi.Mock).mockReturnValue({});
  });

  it('should initialize with no errors', () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    expect(result.current.errors).toEqual({});
  });

  // Test for Step 1: Restaurant Details
  it('validateStep(1) should call validateRestaurantDetailsStep with formData and return true if valid', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateStep(1);
    });
    expect(formValidationUtils.validateRestaurantDetailsStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('validateStep(1) should return false and set errors if validation fails', async () => {
    const mockError = { restaurantName: 'Required' };
    (formValidationUtils.validateRestaurantDetailsStep as vi.Mock).mockReturnValueOnce(mockError);
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateStep(1);
    });
    expect(formValidationUtils.validateRestaurantDetailsStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(false);
    expect(result.current.errors).toEqual(mockError);
  });

  // Test for Step 2: Item Details
  it('validateStep(2) should call validateItemDetailsStep with formData and return true if valid', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateStep(2);
    });
    expect(formValidationUtils.validateItemDetailsStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  it('validateStep(2) should return false and set errors if validation fails', async () => {
    const mockError = { itemName: 'Required' };
    (formValidationUtils.validateItemDetailsStep as vi.Mock).mockReturnValueOnce(mockError);
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = true;
    await act(async () => {
      isValid = await result.current.validateStep(2);
    });
    expect(formValidationUtils.validateItemDetailsStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(false);
    expect(result.current.errors).toEqual(mockError);
  });

  // Test for Step 3: Image Upload
  it('validateStep(3) should call validateImageUploadStep with formData and return true if valid', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateStep(3);
    });
    expect(formValidationUtils.validateImageUploadStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  // Test for Step 4: Review Step
  it('validateStep(4) should call validateReviewStep with formData and return true if valid', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateStep(4);
    });
    expect(formValidationUtils.validateReviewStep).toHaveBeenCalledWith(currentFormData);
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({});
  });

  // Test for unknown step
  it('validateStep should return true and not set errors for an unknown step number', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    let isValid = false;
    await act(async () => {
      isValid = await result.current.validateStep(5); // Non-existent step
    });
    expect(isValid).toBe(true);
    expect(result.current.errors).toEqual({}); 
    expect(formValidationUtils.validateRestaurantDetailsStep).not.toHaveBeenCalled();
    expect(formValidationUtils.validateItemDetailsStep).not.toHaveBeenCalled();
    expect(formValidationUtils.validateImageUploadStep).not.toHaveBeenCalled();
    expect(formValidationUtils.validateReviewStep).not.toHaveBeenCalled();
  });

  it('clearErrors should reset the errors state', async () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    const mockError = { submitterName: 'Cannot be empty' };
    (formValidationUtils.validateRestaurantDetailsStep as vi.Mock).mockReturnValueOnce(mockError);
    await act(async () => {
      await result.current.validateStep(1);
    });
    expect(result.current.errors).toEqual(mockError);
    act(() => {
      result.current.clearErrors();
    });
    expect(result.current.errors).toEqual({});
  });

  it('setErrors should update the errors state', () => {
    const { result } = renderHook(() => useUnifiedFormValidation());
    const newErrors = { itemName: 'Another error' };
    act(() => {
      result.current.setErrors(newErrors);
    });
    expect(result.current.errors).toEqual(newErrors);
  });
});
