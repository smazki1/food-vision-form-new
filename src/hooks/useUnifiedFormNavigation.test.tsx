import { renderHook, act } from '@testing-library/react';
import { useUnifiedFormNavigation, UnifiedFormStep } from './useUnifiedFormNavigation';

const mockSteps: UnifiedFormStep[] = [
  { id: 1, name: 'Step 1' },
  { id: 2, name: 'Step 2' },
  { id: 3, name: 'Step 3' },
];

describe('useUnifiedFormNavigation', () => {
  beforeEach(() => {
    // Reset window.scrollTo mock before each test
    global.scrollTo = vi.fn();
  });

  it('should initialize with the first step active', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    expect(result.current.currentStepId).toBe(1);
    expect(result.current.currentStepConfig).toEqual(mockSteps[0]);
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);
    expect(result.current.totalSteps).toBe(mockSteps.length);
  });

  it('should initialize with a specified initialStepId', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 2));
    expect(result.current.currentStepId).toBe(2);
    expect(result.current.currentStepConfig).toEqual(mockSteps[1]);
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should move to the next step', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    act(() => {
      result.current.moveToNextStep();
    });
    expect(result.current.currentStepId).toBe(2);
    expect(result.current.currentStepConfig).toEqual(mockSteps[1]);
    expect(global.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should not move past the last step when calling moveToNextStep', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 3)); // Start at last step
    act(() => {
      result.current.moveToNextStep();
    });
    expect(result.current.currentStepId).toBe(3); // Should remain on the last step
  });

  it('should move to the previous step', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 2));
    act(() => {
      result.current.moveToPreviousStep();
    });
    expect(result.current.currentStepId).toBe(1);
    expect(result.current.currentStepConfig).toEqual(mockSteps[0]);
    expect(global.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should not move before the first step when calling moveToPreviousStep', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1)); // Start at first step
    act(() => {
      result.current.moveToPreviousStep();
    });
    expect(result.current.currentStepId).toBe(1); // Should remain on the first step
  });

  it('should move to a specific step using moveToStep', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    act(() => {
      result.current.moveToStep(3);
    });
    expect(result.current.currentStepId).toBe(3);
    expect(result.current.currentStepConfig).toEqual(mockSteps[2]);
    expect(global.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('should not move to a non-existent step using moveToStep and warn', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    act(() => {
      result.current.moveToStep(99); // Non-existent step
    });
    expect(result.current.currentStepId).toBe(1); // Should remain on the current step
    expect(consoleWarnSpy).toHaveBeenCalledWith('[UnifiedFormNavigation] Step not found:', 99);
    consoleWarnSpy.mockRestore();
  });

  it('should update isFirstStep and isLastStep flags correctly', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    expect(result.current.isFirstStep).toBe(true);
    expect(result.current.isLastStep).toBe(false);

    act(() => { result.current.moveToNextStep(); }); // Move to step 2
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);

    act(() => { result.current.moveToNextStep(); }); // Move to step 3 (last)
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(true);
    
    act(() => { result.current.moveToPreviousStep(); }); // Move to step 2
    expect(result.current.isFirstStep).toBe(false);
    expect(result.current.isLastStep).toBe(false);
  });

  it('should update steps using updateSteps and reflect changes in navigation', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 1));
    const newMockSteps: UnifiedFormStep[] = [
      { id: 10, name: 'New Step 10' },
      { id: 20, name: 'New Step 20' },
    ];
    act(() => {
      result.current.updateSteps(newMockSteps);
    });
    // After updating steps, currentStepId might become invalid if not present in new steps.
    // The hook doesn't automatically reset currentStepId here, which might be intended or a point for review.
    // For this test, we'll assume we need to manually move to a valid new step.
    expect(result.current.formSteps).toEqual(newMockSteps);
    expect(result.current.totalSteps).toBe(newMockSteps.length);

    // Move to a step within the new set
    act(() => {
      result.current.moveToStep(10);
    });
    expect(result.current.currentStepId).toBe(10);
    expect(result.current.currentStepConfig).toEqual(newMockSteps[0]);
    expect(result.current.isFirstStep).toBe(true);

    act(() => {
      result.current.moveToNextStep();
    });
    expect(result.current.currentStepId).toBe(20);
    expect(result.current.isLastStep).toBe(true);
  });

  it('should reset to a specific step using resetToStep', () => {
    const { result } = renderHook(() => useUnifiedFormNavigation(mockSteps, 3));
     act(() => {
      result.current.resetToStep(1);
    });
    expect(result.current.currentStepId).toBe(1);
    expect(global.scrollTo).toHaveBeenCalledWith(0, 0);
  });
}); 