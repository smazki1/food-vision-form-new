/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicFoodVisionUploadForm from './PublicFoodVisionUploadForm';
import { NewItemFormProvider, useNewItemForm } from '@/contexts/NewItemFormContext'; 
import React from 'react';
import { vi } from 'vitest'; // Explicit import for vi

// Minimal test (can be kept or removed once main tests are fixed)
describe('PublicFoodVisionUploadForm Minimal Test', () => {
  it('should pass a basic assertion', () => {
    expect(true).toBe(true);
    vi.fn(); 
  });
});

// Mock context and hooks
vi.mock('@/contexts/NewItemFormContext', () => ({
    NewItemFormProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, 
    useNewItemForm: vi.fn(), 
}));
const mockedUseNewItemForm = useNewItemForm as import('vitest').Mock;

vi.mock('@/hooks/useUnifiedFormNavigation', () => ({
  useUnifiedFormNavigation: vi.fn(),
}));
import { useUnifiedFormNavigation } from '@/hooks/useUnifiedFormNavigation';
const mockedUseUnifiedFormNavigation = useUnifiedFormNavigation as import('vitest').Mock;

vi.mock('@/hooks/useUnifiedFormValidation', () => ({
  useUnifiedFormValidation: vi.fn(),
}));
import { useUnifiedFormValidation } from '@/hooks/useUnifiedFormValidation';
const mockedUseUnifiedFormValidation = useUnifiedFormValidation as import('vitest').Mock;

vi.mock('./hooks/usePublicFormHandlers', () => ({
  usePublicFormHandlers: vi.fn(),
}));
import { usePublicFormHandlers } from './hooks/usePublicFormHandlers';
const mockedUsePublicFormHandlers = usePublicFormHandlers as import('vitest').Mock;

// Mock Step Components & UI Components
vi.mock('./steps/RestaurantDetailsStep', () => ({
  default: (props: any) => <div data-testid="restaurant-step" onClick={() => props.setExternalErrors?.({ mockError: 'from restaurant' })}>RestaurantDetailsStep (Mock)</div>,
}));
import RestaurantDetailsStepMock from './steps/RestaurantDetailsStep';

vi.mock('./steps/ItemDetailsStep', () => ({
  default: () => <div data-testid="item-step">ItemDetailsStep (Mock)</div>,
}));
import ItemDetailsStepMock from './steps/ItemDetailsStep';

vi.mock('./steps/ImageUploadStep', () => ({
  default: () => <div data-testid="image-step">ImageUploadStep (Mock)</div>,
}));
import ImageUploadStepMock from './steps/ImageUploadStep'; // Though not directly used in failing tests, good for consistency

vi.mock('./steps/ReviewSubmitStep', () => ({
  default: (props: any) => <div data-testid="review-step" onClick={props.onFinalSubmit}>ReviewSubmitStep (Mock)</div>,
}));
import ReviewSubmitStepMock from './steps/ReviewSubmitStep';

vi.mock('./components/ProgressBar', () => ({
  default: () => <div data-testid="progress-bar">ProgressBar (Mock)</div>,
}));
// ProgressBar doesn't need an import if it's just rendered by the main component and not passed as a prop

vi.mock('./components/SuccessModal', () => ({
  default: (props: any) => props.isOpen ? <div data-testid="success-modal">SuccessModal (Mock)</div> : null,
}));
// SuccessModal also doesn't need an import for the same reason

// Default mock implementations for functions returned by hooks
const mockResetFormData = vi.fn();
const mockMoveToNextStep = vi.fn();
const mockMoveToPreviousStep = vi.fn();
const mockMoveToStep = vi.fn();
const mockValidateStep = vi.fn().mockResolvedValue(true); 
const mockClearErrors = vi.fn();
const mockSetErrors = vi.fn();
const mockHandleNext = vi.fn();
const mockHandlePrevious = vi.fn();
const mockHandleSubmit = vi.fn();
const mockHandleNewSubmission = vi.fn();
const mockHandleCloseSuccessModal = vi.fn();


describe('PublicFoodVisionUploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedUseNewItemForm.mockReturnValue({
      formData: { restaurantName: '', submitterName: '', itemName: '', itemType: 'dish', description: '', specialNotes: '', referenceImages: [] },
      updateFormData: vi.fn(),
      resetFormData: mockResetFormData,
    });
    mockedUseUnifiedFormNavigation.mockReturnValue({
      currentStepId: 1,
      currentStepConfig: { id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, // Use imported mock
      formSteps: [{ id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, {id: 2, name: 'Step 2', component: ItemDetailsStepMock}, {id:4, name:'Review', component: ReviewSubmitStepMock}], 
      moveToNextStep: mockMoveToNextStep,
      moveToPreviousStep: mockMoveToPreviousStep,
      moveToStep: mockMoveToStep,
      isFirstStep: true,
      isLastStep: false,
    });
    mockedUseUnifiedFormValidation.mockReturnValue({
      validateStep: mockValidateStep,
      errors: {},
      clearErrors: mockClearErrors,
      setErrors: mockSetErrors,
    });
    mockedUsePublicFormHandlers.mockReturnValue({
      handleNext: mockHandleNext,
      handlePrevious: mockHandlePrevious,
      handleSubmit: mockHandleSubmit,
      handleNewSubmission: mockHandleNewSubmission,
      handleCloseSuccessModal: mockHandleCloseSuccessModal,
      isSubmitting: false,
      showSuccessModal: false,
    });
  });

  const renderForm = () => {
    return render(
      <NewItemFormProvider> 
        <PublicFoodVisionUploadForm />
      </NewItemFormProvider>
    );
  };

  it('renders the progress bar and the initial step component', () => {
    renderForm();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
    expect(screen.getByTestId('restaurant-step')).toBeInTheDocument(); 
    expect(screen.getByText('RestaurantDetailsStep (Mock)')).toBeInTheDocument();
  });

  it('calls resetFormData on mount (useEffect)', () => {
    renderForm();
    expect(mockResetFormData).toHaveBeenCalledTimes(1);
  });

  it('renders navigation buttons and calls handleNext when "Next" is clicked (not on review step)', () => {
    // Default beforeEach setup should handle initial step as RestaurantDetailsStepMock
    renderForm();
    const nextButton = screen.getByRole('button', { name: /הבא/i });
    fireEvent.click(nextButton);
    expect(mockHandleNext).toHaveBeenCalledTimes(1);
  });

  it('calls handlePrevious when "Back" is clicked (not on first step, not on review step)', () => {
    mockedUseUnifiedFormNavigation.mockReturnValueOnce({
      currentStepId: 2, 
      isFirstStep: false, 
      isLastStep: false, 
      currentStepConfig: { id: 2, name: 'Step 2', component: ItemDetailsStepMock }, // Use imported mock
      formSteps: [{ id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, {id: 2, name: 'Step 2', component: ItemDetailsStepMock}, {id:4, name:'Review', component: ReviewSubmitStepMock}]
    });
    renderForm();
    const backButton = screen.getByRole('button', { name: /חזור/i });
    fireEvent.click(backButton);
    expect(mockHandlePrevious).toHaveBeenCalledTimes(1);
  });

  it('does not render general navigation buttons on the review step (step 4)', () => {
    mockedUseUnifiedFormNavigation.mockReturnValueOnce({
      currentStepId: 4, 
      isFirstStep: false, 
      isLastStep: true, 
      currentStepConfig: { id: 4, name: 'Review', component: ReviewSubmitStepMock }, // Use imported mock
      formSteps: [{ id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, {id: 2, name: 'Step 2', component: ItemDetailsStepMock}, {id:4, name:'Review', component: ReviewSubmitStepMock}]
    });
    renderForm();
    expect(screen.queryByRole('button', { name: /הבא/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /חזור/i })).not.toBeInTheDocument(); 
  });

  it('passes onFinalSubmit to ReviewSubmitStep when on review step', () => {
    mockedUseUnifiedFormNavigation.mockReturnValueOnce({
        currentStepId: 4, 
        isLastStep: true, 
        currentStepConfig: { id: 4, name: 'Review', component: ReviewSubmitStepMock }, // Use imported mock
        formSteps: [{ id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, {id: 2, name: 'Step 2', component: ItemDetailsStepMock}, {id:4, name:'Review', component: ReviewSubmitStepMock}]
    });
    renderForm();
    const reviewStep = screen.getByTestId('review-step');
    fireEvent.click(reviewStep); 
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
  });


  it('passes setExternalErrors, clearExternalErrors, and errors to the current step component', () => {
    const mockErrorsObject = { someError: 'This is an error' };
    mockedUseUnifiedFormValidation.mockReturnValueOnce({
      validateStep: mockValidateStep,
      errors: mockErrorsObject,
      clearErrors: mockClearErrors,
      setErrors: mockSetErrors,
    });
    mockedUseUnifiedFormNavigation.mockReturnValueOnce({
      currentStepId: 1, 
      currentStepConfig: { id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, // Use imported mock
      formSteps: [{ id: 1, name: 'Step 1', component: RestaurantDetailsStepMock }, {id: 2, name: 'Step 2', component: ItemDetailsStepMock}, {id:4, name:'Review', component: ReviewSubmitStepMock}],
      isFirstStep: true,
      isLastStep: false
    });

    renderForm();
    const restaurantStep = screen.getByTestId('restaurant-step');
    fireEvent.click(restaurantStep);
    expect(mockSetErrors).toHaveBeenCalledWith({ mockError: 'from restaurant' }); 
  });

  it('shows SuccessModal when showSuccessModal from handlers is true', () => {
    mockedUsePublicFormHandlers.mockReturnValueOnce({
      handleNext: mockHandleNext,
      handlePrevious: mockHandlePrevious,
      handleSubmit: mockHandleSubmit,
      handleNewSubmission: mockHandleNewSubmission,
      handleCloseSuccessModal: mockHandleCloseSuccessModal,
      isSubmitting: false,
      showSuccessModal: true, 
    });
    renderForm();
    expect(screen.getByTestId('success-modal')).toBeInTheDocument();
  });

}); 