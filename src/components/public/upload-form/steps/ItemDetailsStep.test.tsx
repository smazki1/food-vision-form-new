/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ItemDetailsStep from './ItemDetailsStep';
import { NewItemFormProvider, useNewItemForm, NewItemFormData } from '@/contexts/NewItemFormContext';
import React from 'react';

// Mock @tanstack/react-query
const mockUseQuery = vi.fn(); // Define the mock function here
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal() as any; 
  return {
    ...actual,
    useQuery: mockUseQuery, // Use the predefined mock function
  };
});

const mockSetExternalErrors = vi.fn();
const mockClearExternalErrors = vi.fn();

const renderWithFormProvider = (ui: React.ReactElement, initialFormData?: Partial<NewItemFormData>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const { updateFormData } = useNewItemForm();
    React.useEffect(() => {
      if (initialFormData) {
        updateFormData(initialFormData);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return children;
  };
  return render(
    <NewItemFormProvider>
      <Wrapper>{ui}</Wrapper>
    </NewItemFormProvider>
  );
};

describe('ItemDetailsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // This will clear mockUseQuery as well
    // Set default mock implementation for useQuery before each test
    mockUseQuery.mockReturnValue({
      data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
      isLoading: false,
      isError: false,
    });
  });

  it('renders input fields for item name, type buttons, and description', () => {
    renderWithFormProvider(<ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    expect(screen.getByLabelText(/שם המנה/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /מנה\/מוצר/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /שתיה/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /קוקטייל/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/ספרו בקצרה מה מרכיבי המנה העיקריים/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/הערות מיוחדות/i)).toBeInTheDocument();
  });

  it('updates formData in context when item name changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    fireEvent.change(screen.getByLabelText(/שם המנה/i), { target: { value: 'Test Dish' } });
    expect(capturedFormData.itemName).toBe('Test Dish');
  });

  it('updates formData in context when description changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    fireEvent.change(screen.getByLabelText(/ספרו בקצרה מה מרכיבי המנה העיקריים/i), { target: { value: 'Delicious dish.' } });
    expect(capturedFormData.description).toBe('Delicious dish.');
  });

  it('updates formData in context when special notes changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    fireEvent.change(screen.getByLabelText(/הערות מיוחדות/i), { target: { value: 'Extra spicy.' } });
    expect(capturedFormData.specialNotes).toBe('Extra spicy.');
  });

  it('updates formData in context when item type button (e.g., cocktail) is clicked', async () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    const cocktailButton = screen.getByRole('button', { name: /קוקטייל/i });
    fireEvent.click(cocktailButton);
    await waitFor(() => {
        expect(capturedFormData.itemType).toBe('cocktail');
    });
  });

  it('displays error messages for relevant fields', () => {
    const errors = {
      itemName: 'Item name is required',
      itemType: 'Item type is required',
      description: 'Description is required',
    };
    renderWithFormProvider(<ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    expect(screen.getByText(errors.itemName)).toBeInTheDocument();
    expect(screen.getByText(errors.itemType)).toBeInTheDocument();
    expect(screen.getByText(errors.description)).toBeInTheDocument();
  });

  it('pre-fills inputs and selects the correct item type button based on formData context', async () => {
    const initialData: Partial<NewItemFormData> = {
      itemName: 'Initial Dish',
      itemType: 'drink', 
      description: 'Initial Description',
      specialNotes: 'Initial Notes'
    };
    renderWithFormProvider(
        <ItemDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />,
        initialData
    );
    expect(screen.getByLabelText(/שם המנה/i)).toHaveValue('Initial Dish');
    const drinkButton = screen.getByRole('button', { name: /שתיה/i });
    expect(drinkButton).toHaveClass('border-[#F3752B]'); 
    expect(drinkButton).toHaveClass('text-[#F3752B]');
    const dishButton = screen.getByRole('button', { name: /מנה\/מוצר/i });
    expect(dishButton).not.toHaveClass('border-[#F3752B]'); 
    expect(dishButton).not.toHaveClass('text-[#F3752B]');
    expect(screen.getByLabelText(/ספרו בקצרה מה מרכיבי המנה העיקריים/i)).toHaveValue('Initial Description');
    expect(screen.getByLabelText(/הערות מיוחדות/i)).toHaveValue('Initial Notes');
  });
}); 