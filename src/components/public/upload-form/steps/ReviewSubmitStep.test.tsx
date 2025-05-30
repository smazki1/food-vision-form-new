import { render, screen, fireEvent } from '@testing-library/react';
import ReviewSubmitStep from './ReviewSubmitStep';
import { NewItemFormProvider, NewItemFormData, useNewItemForm } from '@/contexts/NewItemFormContext';
import React from 'react';

const mockOnFinalSubmit = vi.fn();
const mockOnBack = vi.fn();

// Helper to render with FormProvider and an optional initial state for formData
const renderWithFormProviderAndData = (
  ui: React.ReactElement,
  initialData?: Partial<NewItemFormData>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const { updateFormData } = useNewItemForm();
    React.useEffect(() => {
      if (initialData) {
        updateFormData(initialData);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount
    return <>{children}</>;
  };

  return render(
    <NewItemFormProvider>
      <Wrapper>{ui}</Wrapper>
    </NewItemFormProvider>
  );
};

describe('ReviewSubmitStep', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fullFormData: NewItemFormData = {
    restaurantName: 'Test Restaurant',
    submitterName: 'John Doe',
    itemName: 'Awesome Dish',
    itemType: 'dish',
    description: 'A very tasty dish with many ingredients.',
    specialNotes: 'Make it extra spicy!',
    referenceImages: [new File(['img1'], 'image1.png', { type: 'image/png' })],
  };

  it('renders all form data correctly for review', () => {
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={{}} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      fullFormData
    );

    expect(screen.getByText(fullFormData.restaurantName)).toBeInTheDocument();
    expect(screen.getByText(fullFormData.submitterName)).toBeInTheDocument();
    expect(screen.getByText(fullFormData.itemName)).toBeInTheDocument();
    expect(screen.getByText(fullFormData.description)).toBeInTheDocument();
    expect(screen.getByText(fullFormData.specialNotes)).toBeInTheDocument();
    expect(screen.getByText(`${fullFormData.referenceImages.length} תמונות`)).toBeInTheDocument();
    expect(screen.getByText(/הגשה זו תנצל מנה אחת מהחבילה שלך/i)).toBeInTheDocument();
  });

  it('does not render specialNotes if not provided', () => {
    const dataWithoutNotes = { ...fullFormData, specialNotes: '' };
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={{}} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      dataWithoutNotes
    );
    expect(screen.queryByText('הערות מיוחדות:')).not.toBeInTheDocument(); // Check for the label
    expect(screen.queryByText(fullFormData.specialNotes)).not.toBeInTheDocument(); // Check for the value (which is now empty)
  });

  it('calls onFinalSubmit when "שלח בקשה" button is clicked', () => {
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={{}} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      fullFormData
    );
    fireEvent.click(screen.getByRole('button', { name: /שלח בקשה/i }));
    expect(mockOnFinalSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when "חזור" button is clicked', () => {
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={{}} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      fullFormData
    );
    fireEvent.click(screen.getByRole('button', { name: /חזור/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('disables submit button if onFinalSubmit is not provided (e.g., during loading)', () => {
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={{}} onFinalSubmit={undefined} onBack={mockOnBack} />,
      fullFormData
    );
    expect(screen.getByRole('button', { name: /שלח בקשה/i })).toBeDisabled();
  });

  it('displays finalCheck error message if present', () => {
    const errors = { finalCheck: 'Final submission error!' };
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={errors} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      fullFormData
    );
    expect(screen.getByText(errors.finalCheck)).toBeInTheDocument();
  });

  it('displays submit error message if present (alternative error prop)', () => {
    const errors = { submit: 'Generic submission error!' };
    renderWithFormProviderAndData(
      <ReviewSubmitStep errors={errors} onFinalSubmit={mockOnFinalSubmit} onBack={mockOnBack} />,
      fullFormData
    );
    expect(screen.getByText(errors.submit)).toBeInTheDocument();
  });
}); 