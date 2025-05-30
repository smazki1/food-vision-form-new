import { render, screen, fireEvent, within } from '@testing-library/react';
import ProgressBar from './ProgressBar';
import { UnifiedFormStep } from '@/hooks/useUnifiedFormNavigation';
import React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore vitest global is not recognized by linter here
vi.mock('lucide-react', async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore vitest global is not recognized by linter here
  const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react');
  return {
    ...actual,
    CheckCircle: (props: React.SVGProps<SVGSVGElement>) => { // Use React.SVGProps for better typing
      // Replicate a basic structure of the CheckCircle icon or use a placeholder
      return (
        <svg 
          data-testid="CheckCircleIcon" 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          {...props}
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    },
  };
});

const mockSteps: UnifiedFormStep[] = [
  { id: 1, name: 'פרטי מסעדה' },
  { id: 2, name: 'פרטי המנה' },
  { id: 3, name: 'העלאת תמונות' },
  { id: 4, name: 'סקירה ואישור' },
];

describe('ProgressBar', () => {
  it('renders all step names', () => {
    render(<ProgressBar currentStep={1} totalSteps={mockSteps.length} steps={mockSteps} />);
    mockSteps.forEach(step => {
      expect(screen.getByText(step.name)).toBeInTheDocument();
    });
  });

  it('applies correct classes for active, completed, and upcoming states', () => {
    const currentStepId = 2; // Step 1 completed, Step 2 active, Step 3 & 4 upcoming
    render(<ProgressBar currentStep={currentStepId} totalSteps={mockSteps.length} steps={mockSteps} />);

    // Step 1 (Completed)
    const completedStepNode = screen.getByTestId(`step-node-${mockSteps[0].id}`);
    const completedStepCircle = screen.getByTestId(`step-circle-${mockSteps[0].id}`);
    expect(completedStepNode.querySelector('span')).toHaveClass('text-emerald-600');
    expect(completedStepCircle).toHaveClass('bg-emerald-500 border-emerald-500 text-white');
    expect(within(completedStepCircle).getByTestId('CheckCircleIcon')).toBeInTheDocument();

    // Step 2 (Active)
    const activeStepNode = screen.getByTestId(`step-node-${mockSteps[1].id}`);
    const activeStepCircle = screen.getByTestId(`step-circle-${mockSteps[1].id}`);
    expect(activeStepNode.querySelector('span')).toHaveClass('text-[#F3752B] font-semibold');
    expect(activeStepCircle).toHaveClass('bg-[#F3752B] border-[#F3752B] text-white');
    expect(activeStepCircle.textContent).toBe(mockSteps[1].id.toString());

    // Step 3 (Upcoming)
    const upcomingStepNode = screen.getByTestId(`step-node-${mockSteps[2].id}`);
    const upcomingStepCircle = screen.getByTestId(`step-circle-${mockSteps[2].id}`);
    expect(upcomingStepNode.querySelector('span')).toHaveClass('text-gray-400');
    expect(upcomingStepCircle).toHaveClass('bg-white border-gray-300 text-gray-400');
    expect(upcomingStepCircle.textContent).toBe(mockSteps[2].id.toString());
    
    // Step 4 (Upcoming)
    const lastUpcomingStepNode = screen.getByTestId(`step-node-${mockSteps[3].id}`);
    const lastUpcomingStepCircle = screen.getByTestId(`step-circle-${mockSteps[3].id}`);
    expect(lastUpcomingStepNode.querySelector('span')).toHaveClass('text-gray-400');
    expect(lastUpcomingStepCircle).toHaveClass('bg-white border-gray-300 text-gray-400');
    expect(lastUpcomingStepCircle.textContent).toBe(mockSteps[3].id.toString());
    
    // Check progress line indicator width
    const progressLineIndicator = screen.getByTestId('progress-line-indicator');
    // For currentStepId = 2 and totalSteps = 4, width should be ((2-1)/(4-1))*100 = 33.33...%
    expect(progressLineIndicator).toHaveStyle('width: 33.33333333333333%');
  });

  // This test is removed as the component has one main progress line, not separate lines.
  // it('renders correct number of connecting lines', () => {
  //   render(<ProgressBar currentStep={1} totalSteps={mockSteps.length} steps={mockSteps} />);
  //   const lines = screen.getAllByTestId(/step-line-/);
  //   expect(lines).toHaveLength(mockSteps.length - 1);
  // });
}); 