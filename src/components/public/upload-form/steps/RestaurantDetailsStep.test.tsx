/// <reference types="vitest/globals" />
import { render, screen, fireEvent } from '@testing-library/react';
import RestaurantDetailsStep from './RestaurantDetailsStep';
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

// Mock Lucide icons if any are used directly in this step (e.g. for input adornments)
// For now, assuming no icons that need specific mocking within this step component itself.

const mockSetExternalErrors = vi.fn();
const mockClearExternalErrors = vi.fn();

const renderWithFormProvider = (ui: React.ReactElement, initialFormData?: Partial<NewItemFormData>) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    const { updateFormData, formData } = useNewItemForm();
    React.useEffect(() => {
      if (initialFormData && JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
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

describe('RestaurantDetailsStep', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // This will clear mockUseQuery as well
    // Set default mock implementation for useQuery before each test
    mockUseQuery.mockReturnValue({
      data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
      isLoading: false,
      isError: false,
    });
  });

  it('renders input fields for restaurant name and submitter name', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    expect(screen.getByLabelText(/שם המסעדה/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/שם איש הקשר/i)).toBeInTheDocument(); 
  });

  it('updates formData in context when restaurant name changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    const restaurantInput = screen.getByLabelText(/שם המסעדה/i);
    fireEvent.change(restaurantInput, { target: { value: 'Test Restaurant' } });
    expect(capturedFormData.restaurantName).toBe('Test Restaurant');
  });

  it('updates formData in context when submitter name changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    const submitterInput = screen.getByLabelText(/שם איש הקשר/i);
    fireEvent.change(submitterInput, { target: { value: 'Test Submitter' } });
    expect(capturedFormData.submitterName).toBe('Test Submitter');
  });

  it('displays error message for restaurantName when passed in props', () => {
    const errors = { restaurantName: 'Restaurant name is required' };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    expect(screen.getByText(errors.restaurantName)).toBeInTheDocument();
  });

  it('displays error message for submitterName when passed in props', () => {
    const errors = { submitterName: 'Submitter name is required' };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    expect(screen.getByText(errors.submitterName)).toBeInTheDocument();
  });

  it('pre-fills inputs with values from formData context on initial render', () => {
    const initialData: Partial<NewItemFormData> = {
      restaurantName: 'Initial Restaurant',
      submitterName: 'Initial Submitter'
    };
    renderWithFormProvider(
      <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />,
      initialData
    );
    expect(screen.getByLabelText(/שם המסעדה/i)).toHaveValue('Initial Restaurant');
    expect(screen.getByLabelText(/שם איש הקשר/i)).toHaveValue('Initial Submitter');
  });

  it('inputs are empty if no initial data is provided from context', () => {
    renderWithFormProvider(
        <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />
    );
    expect(screen.getByLabelText(/שם המסעדה/i)).toHaveValue('');
    expect(screen.getByLabelText(/שם איש הקשר/i)).toHaveValue('');
  });

}); 