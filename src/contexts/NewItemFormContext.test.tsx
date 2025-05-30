import { renderHook, act } from '@testing-library/react';
import { NewItemFormProvider, useNewItemForm, NewItemFormData } from './NewItemFormContext';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NewItemFormProvider>{children}</NewItemFormProvider>
);

describe('NewItemFormContext', () => {
  const initialFormData: NewItemFormData = {
    restaurantName: '',
    submitterName: '',
    itemName: '',
    itemType: 'dish',
    description: '',
    specialNotes: '',
    referenceImages: []
  };

  it('should provide initial form data', () => {
    const { result } = renderHook(() => useNewItemForm(), { wrapper });
    expect(result.current.formData).toEqual(initialFormData);
  });

  it('should update form data correctly', () => {
    const { result } = renderHook(() => useNewItemForm(), { wrapper });
    const updates: Partial<NewItemFormData> = {
      restaurantName: 'Test Restaurant',
      itemName: 'Test Item'
    };

    act(() => {
      result.current.updateFormData(updates);
    });

    expect(result.current.formData.restaurantName).toBe('Test Restaurant');
    expect(result.current.formData.itemName).toBe('Test Item');
    // Check other fields remain initial
    expect(result.current.formData.submitterName).toBe('');
    expect(result.current.formData.itemType).toBe('dish');
  });

  it('should update form data with multiple partial updates', () => {
    const { result } = renderHook(() => useNewItemForm(), { wrapper });
    
    act(() => {
      result.current.updateFormData({ restaurantName: 'Resto1' });
    });
    expect(result.current.formData.restaurantName).toBe('Resto1');

    act(() => {
      result.current.updateFormData({ submitterName: 'Submitter1' });
    });
    expect(result.current.formData.restaurantName).toBe('Resto1'); // Should persist
    expect(result.current.formData.submitterName).toBe('Submitter1');
    
    act(() => {
      result.current.updateFormData({ itemType: 'drink' });
    });
    expect(result.current.formData.itemType).toBe('drink');
    expect(result.current.formData.restaurantName).toBe('Resto1');
    expect(result.current.formData.submitterName).toBe('Submitter1');
  });

  it('should reset form data to initial state', () => {
    const { result } = renderHook(() => useNewItemForm(), { wrapper });
    const updates: Partial<NewItemFormData> = {
      restaurantName: 'Another Restaurant',
      description: 'Some description'
    };

    act(() => {
      result.current.updateFormData(updates);
    });

    // Ensure it was updated first
    expect(result.current.formData.restaurantName).toBe('Another Restaurant');
    expect(result.current.formData.description).toBe('Some description');

    act(() => {
      result.current.resetFormData();
    });

    expect(result.current.formData).toEqual(initialFormData);
  });

  it('should handle updates to referenceImages (file array)', () => {
    const { result } = renderHook(() => useNewItemForm(), { wrapper });
    const testFile1 = new File(['content1'], 'file1.png', { type: 'image/png' });
    const testFile2 = new File(['content2'], 'file2.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.updateFormData({ referenceImages: [testFile1] });
    });
    expect(result.current.formData.referenceImages).toHaveLength(1);
    expect(result.current.formData.referenceImages[0]).toBe(testFile1);

    act(() => {
      result.current.updateFormData({ referenceImages: [testFile1, testFile2] });
    });
    expect(result.current.formData.referenceImages).toHaveLength(2);
    expect(result.current.formData.referenceImages[1]).toBe(testFile2);
    
    act(() => {
      result.current.updateFormData({ referenceImages: [] });
    });
    expect(result.current.formData.referenceImages).toHaveLength(0);
  });

}); 