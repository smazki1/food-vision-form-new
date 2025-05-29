import { renderHook, act, waitFor } from '@testing-library/react';
import { usePublicFormHandlers } from './usePublicFormHandlers';
import { NewItemFormProvider, useNewItemForm, NewItemFormData } from '@/contexts/NewItemFormContext';
import * as PublicFormSubmissionHook from '@/hooks/usePublicFormSubmission';
import React from 'react';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('@/hooks/usePublicFormSubmission', () => ({
  usePublicFormSubmission: vi.fn(),
}));

// Create mocks for context functions
const mockContextUpdateFormData = vi.fn();
const mockContextResetFormData = vi.fn();
let currentFormDataState: NewItemFormData = { // Simulate the form data state
  restaurantName: '',
  submitterName: '',
  itemName: '',
  itemType: 'dish',
  description: '',
  specialNotes: '',
  referenceImages: [],
};

vi.mock('@/contexts/NewItemFormContext', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual, // Keep actual NewItemFormProvider if it's simple or also mock it if needed
    useNewItemForm: () => ({
      formData: currentFormDataState,
      updateFormData: mockContextUpdateFormData.mockImplementation((updates) => {
        currentFormDataState = { ...currentFormDataState, ...updates };
      }),
      resetFormData: mockContextResetFormData.mockImplementation(() => {
        currentFormDataState = { restaurantName: '', submitterName: '', itemName: '', itemType: 'dish', description: '', specialNotes: '', referenceImages: [] }; // Reset to initial
      }),
    }),
  };
});

const mockMoveToNextStep = vi.fn();
const mockMoveToPreviousStep = vi.fn();
const mockMoveToStep = vi.fn();
const mockValidateStep = vi.fn();
const mockClearErrors = vi.fn();
const mockSubmitForm = vi.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NewItemFormProvider>{children}</NewItemFormProvider>
);

describe('usePublicFormHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (PublicFormSubmissionHook.usePublicFormSubmission as import('vitest').Mock).mockReturnValue({
      isSubmitting: false,
      submitForm: mockSubmitForm,
    });
    // Reset formData state before each test that might use it
    currentFormDataState = { restaurantName: '', submitterName: '', itemName: '', itemType: 'dish', description: '', specialNotes: '', referenceImages: [] };
    mockContextUpdateFormData.mockImplementation((updates) => {
      currentFormDataState = { ...currentFormDataState, ...updates };
    });
    mockContextResetFormData.mockImplementation(() => {
      currentFormDataState = { restaurantName: '', submitterName: '', itemName: '', itemType: 'dish', description: '', specialNotes: '', referenceImages: [] };
    });
  });

  const getRenderedHook = (currentStepId = 1, isLastStep = false) => {
    return renderHook(
      () => usePublicFormHandlers(
        currentStepId,
        isLastStep,
        mockMoveToNextStep,
        mockMoveToPreviousStep,
        mockMoveToStep,
        mockValidateStep,
        mockClearErrors
      ),
      { wrapper }
    );
  };

  describe('handleNext', () => {
    it('should call validateStep and moveToNextStep if valid and not last step', async () => {
      mockValidateStep.mockResolvedValue(true);
      const { result } = getRenderedHook(1, false);
      await act(async () => { await result.current.handleNext(); });
      expect(mockValidateStep).toHaveBeenCalledWith(1);
      expect(mockMoveToNextStep).toHaveBeenCalled();
    });

    it('should not call moveToNextStep if validation fails', async () => {
      mockValidateStep.mockResolvedValue(false);
      const { result } = getRenderedHook(1, false);
      await act(async () => { await result.current.handleNext(); });
      expect(mockValidateStep).toHaveBeenCalledWith(1);
      expect(mockMoveToNextStep).not.toHaveBeenCalled();
    });

    it('should not call moveToNextStep if it is the last step', async () => {
      mockValidateStep.mockResolvedValue(true);
      const { result } = getRenderedHook(2, true); 
      await act(async () => { await result.current.handleNext(); });
      expect(mockValidateStep).toHaveBeenCalledWith(2);
      expect(mockMoveToNextStep).not.toHaveBeenCalled();
    });
  });

  describe('handlePrevious', () => {
    it('should call clearErrors and moveToPreviousStep if not on first step', () => {
      const { result } = getRenderedHook(2, false); 
      act(() => { result.current.handlePrevious(); });
      expect(mockClearErrors).toHaveBeenCalled();
      expect(mockMoveToPreviousStep).toHaveBeenCalled();
    });

    it('should not call moveToPreviousStep if on the first step (currentStepId = 1)', () => {
      const { result } = getRenderedHook(1, false); 
      act(() => { result.current.handlePrevious(); });
      expect(mockClearErrors).toHaveBeenCalled(); 
      expect(mockMoveToPreviousStep).not.toHaveBeenCalled();
    });
  });

  describe('handleSubmit', () => {
    it('should validate step and call submitForm if valid', async () => {
      mockValidateStep.mockResolvedValue(true);
      mockSubmitForm.mockResolvedValue(true);
      const { result } = getRenderedHook(2, true);
      await act(async () => { await result.current.handleSubmit(); });
      expect(mockValidateStep).toHaveBeenCalledWith(2);
      expect(mockSubmitForm).toHaveBeenCalled();
      // Expect modal to be true after successful submit
      await waitFor(() => expect(result.current.showSuccessModal).toBe(true));
    });

    it('should not call submitForm if validation fails', async () => {
      mockValidateStep.mockResolvedValue(false);
      const { result } = getRenderedHook(2, true);
      await act(async () => { await result.current.handleSubmit(); });
      expect(mockValidateStep).toHaveBeenCalledWith(2);
      expect(mockSubmitForm).not.toHaveBeenCalled();
      expect(result.current.showSuccessModal).toBe(false);
    });

    it('should not show success modal if submitForm returns false', async () => {
      mockValidateStep.mockResolvedValue(true);
      mockSubmitForm.mockResolvedValue(false);
      const { result } = getRenderedHook(2, true);
      await act(async () => { await result.current.handleSubmit(); });
      expect(mockSubmitForm).toHaveBeenCalled();
      expect(result.current.showSuccessModal).toBe(false);
    });
  });

  describe('handleNewSubmission', () => {
    it('should call resetFormData, moveToStep, clearErrors, and hide modal, and go to step 1 if no restaurant name', async () => {
        // DO NOT pre-fill restaurantName here to test the moveToStep(1) path
        // currentFormDataState will be its default empty state from beforeEach

        const { result } = renderHook(
            () => usePublicFormHandlers(
                1, 
                false, 
                mockMoveToNextStep, 
                mockMoveToPreviousStep, 
                mockMoveToStep, 
                mockValidateStep, 
                mockClearErrors 
            ),
            { wrapper } 
        );
        
        mockValidateStep.mockResolvedValue(true); 
        mockSubmitForm.mockResolvedValue(true);

        await act(async () => { await result.current.handleSubmit(); });
        await waitFor(() => expect(result.current.showSuccessModal).toBe(true)); 

        await act(async () => { result.current.handleNewSubmission(); });

        expect(mockContextResetFormData).toHaveBeenCalled(); 
        expect(mockClearErrors).toHaveBeenCalled();
        
        await waitFor(() => {
          expect(result.current.showSuccessModal).toBe(false);
        });
        
        await new Promise(resolve => setTimeout(resolve, 150)); // Wait for setTimeout in handleNewSubmission
        expect(mockMoveToStep).toHaveBeenCalledWith(1); // Expect step 1 because restaurantName was empty
    });

    it('should call moveToStep with 2 if restaurantName exists', async () => {
        act(() => {
          // Pre-fill restaurantName here to test the moveToStep(2) path
          mockContextUpdateFormData({ restaurantName: 'Kept Resto', submitterName: 'Kept Submitter' });
        });

        const { result } = renderHook(
            () => usePublicFormHandlers(
                1, 
                false, 
                mockMoveToNextStep, 
                mockMoveToPreviousStep, 
                mockMoveToStep, 
                mockValidateStep, 
                mockClearErrors
            ),
            { wrapper }
        );
        
        mockValidateStep.mockResolvedValue(true);
        mockSubmitForm.mockResolvedValue(true);
        await act(async () => { await result.current.handleSubmit(); });
        await waitFor(() => expect(result.current.showSuccessModal).toBe(true));

        await act(async () => {
            result.current.handleNewSubmission(); 
        });

        await new Promise(resolve => setTimeout(resolve, 150)); // Wait for setTimeout
        
        expect(mockContextResetFormData).toHaveBeenCalled();
        expect(mockMoveToStep).toHaveBeenCalledWith(2); // Expect step 2 because restaurantName was present
        await waitFor(() => expect(result.current.showSuccessModal).toBe(false));
    });
  });

  describe('handleCloseSuccessModal', () => {
    it('should set showSuccessModal to false', async () => { 
      const { result } = getRenderedHook(1, true);
      
      mockValidateStep.mockResolvedValue(true);
      mockSubmitForm.mockResolvedValue(true);
      await act(async () => { await result.current.handleSubmit(); });
      await waitFor(() => expect(result.current.showSuccessModal).toBe(true)); 

      await act(async () => { result.current.handleCloseSuccessModal(); }); 
      expect(result.current.showSuccessModal).toBe(false);
    });
  });
}); 