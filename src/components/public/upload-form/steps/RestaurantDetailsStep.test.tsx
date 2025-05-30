/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RestaurantDetailsStep from './RestaurantDetailsStep';
import { NewItemFormProvider, useNewItemForm, NewItemFormData } from '@/contexts/NewItemFormContext';
import React from 'react';

// פתרון mocking נכון ל-useQuery
let mockUseQueryImpl: any = (options: any) => {
  // דיפולט: session
  if (options && options.queryKey && options.queryKey[0] === 'current-session') {
    return {
      data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
      isLoading: false,
      isError: false,
    };
  }
  // דיפולט: client-details
  if (options && options.queryKey && options.queryKey[0] === 'client-details') {
    return {
      data: { restaurant_name: 'Auto Restaurant', contact_name: 'Auto Submitter' },
      isLoading: false,
      isError: false,
    };
  }
  return {
    data: undefined,
    isLoading: false,
    isError: false,
  };
};
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    useQuery: (options: any) => mockUseQueryImpl(options),
  });
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
    vi.clearAllMocks();
    mockUseQueryImpl = (options: any) => {
      if (options && options.queryKey && options.queryKey[0] === 'current-session') {
        return {
          data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
          isLoading: false,
          isError: false,
        };
      }
      if (options && options.queryKey && options.queryKey[0] === 'client-details') {
        return {
          data: { restaurant_name: 'Auto Restaurant', contact_name: 'Auto Submitter' },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    };
  });

  it('renders input fields for restaurant name and submitter name', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(screen.getByLabelText(/שם המסעדה/)).toBeInTheDocument();
    expect(screen.getByLabelText(/שם מלא של המגיש/)).toBeInTheDocument();
  });

  it('updates formData in context when restaurant name changes', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const restaurantInput = screen.getByLabelText(/שם המסעדה/);
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
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const submitterInput = screen.getByLabelText(/שם מלא של המגיש/);
    fireEvent.change(submitterInput, { target: { value: 'Test Submitter' } });
    expect(capturedFormData.submitterName).toBe('Test Submitter');
  });

  it('displays error message for restaurantName when passed in props', async () => {
    const errors = { restaurantName: 'Restaurant name is required' };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByText(errors.restaurantName)).toBeInTheDocument();
  });

  it('displays error message for submitterName when passed in props', async () => {
    const errors = { submitterName: 'Submitter name is required' };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={errors} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByText(errors.submitterName)).toBeInTheDocument();
  });

  it('pre-fills inputs with values from formData context on initial render', async () => {
    const initialData: Partial<NewItemFormData> = {
      restaurantName: 'Initial Restaurant',
      submitterName: 'Initial Submitter'
    };
    renderWithFormProvider(
      <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />, initialData
    );
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByDisplayValue('Initial Restaurant')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Initial Submitter')).toBeInTheDocument();
  });

  it('inputs are empty if no initial data is provided from context', async () => {
    renderWithFormProvider(
        <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />
    );
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByDisplayValue('')).toBeInTheDocument();
  });

  it('does not show email/phone fields if no status selected', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    expect(screen.queryByLabelText(/אימייל לקבל תוצאות/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/טלפון ליצירת קשר/)).not.toBeInTheDocument();
  });

  it('shows email and phone fields as required when selecting "לא, זו פעם ראשונה שלנו"', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(screen.getByLabelText(/אימייל לקבל תוצאות/)).toBeInTheDocument();
    expect(screen.getByLabelText(/טלפון ליצירת קשר/)).toBeInTheDocument();
  });

  it('hides email/phone fields when selecting "כן, העסק שלנו רשום" and not authenticated', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('כן, העסק שלנו רשום'));
    expect(screen.queryByLabelText(/אימייל לקבל תוצאות/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/טלפון ליצירת קשר/)).not.toBeInTheDocument();
  });

  it('shows email/phone fields if authenticated regardless of business status', async () => {
    // סימולציה של משתמש מחובר
    mockUseQueryImpl = (options: any) => {
      if (options && options.queryKey && options.queryKey[0] === 'current-session') {
        return {
          data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
          isLoading: false,
          isError: false,
        };
      }
      if (options && options.queryKey && options.queryKey[0] === 'client-details') {
        return {
          data: { restaurant_name: 'Auto Restaurant', contact_name: 'Auto Submitter' },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    // בחר סטטוס עסק כדי להציג את השדות
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByLabelText(/אימייל לקבל תוצאות/)).toBeInTheDocument();
    expect(await screen.findByLabelText(/טלפון ליצירת קשר/)).toBeInTheDocument();
  });

  it('loads user data and auto-fills fields when authenticated', async () => {
    mockUseQueryImpl = (options: any) => {
      if (options && options.queryKey && options.queryKey[0] === 'current-session') {
        return {
          data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
          isLoading: false,
          isError: false,
        };
      }
      if (options && options.queryKey && options.queryKey[0] === 'client-details') {
        return {
          data: { restaurant_name: 'Auto Restaurant', contact_name: 'Auto Submitter' },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    };
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(await screen.findByDisplayValue('Auto Restaurant')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Auto Submitter')).toBeInTheDocument();
  });

  it('handles client data loading error gracefully', async () => {
    // ודא שהמשתמש מחובר
    mockUseQueryImpl = (options: any) => {
      if (options && options.queryKey && options.queryKey[0] === 'current-session') {
        return {
          data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
          isLoading: false,
          isError: false,
        };
      }
      if (options && options.queryKey && options.queryKey[0] === 'client-details') {
        return {
          data: undefined,
          isLoading: false,
          isError: true,
          error: new Error('fail'),
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    };
    await act(async () => {
      renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    });
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('שגיאה בטעינת פרטי הלקוח'))).toBeInTheDocument();
    });
  });

  it('switching between business status resets required fields', () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const emailInput = screen.getByLabelText(/אימייל לקבל תוצאות/);
    fireEvent.change(emailInput, { target: { value: 'test@email.com' } });
    expect(emailInput).toHaveValue('test@email.com');
    fireEvent.click(screen.getByText('כן, העסק שלנו רשום'));
    expect(screen.queryByLabelText(/אימייל לקבל תוצאות/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    expect(screen.getByLabelText(/אימייל לקבל תוצאות/)).toBeInTheDocument();
  });
});

describe('RestaurantDetailsStep - Advanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryImpl = (options: any) => {
      if (options && options.queryKey && options.queryKey[0] === 'current-session') {
        return {
          data: { session: { user: { id: 'test-user-id', email: 'test@example.com' } } },
          isLoading: false,
          isError: false,
        };
      }
      if (options && options.queryKey && options.queryKey[0] === 'client-details') {
        return {
          data: { restaurant_name: 'Auto Restaurant', contact_name: 'Auto Submitter' },
          isLoading: false,
          isError: false,
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
      };
    };
  });

  it('shows error for invalid email format', async () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const emailInput = screen.getByLabelText(/אימייל לקבל תוצאות/);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.blur(emailInput);
    expect(await screen.findByText((content) => content.includes('כתובת אימייל לא תקינה'))).toBeInTheDocument();
  });

  it('updates context when changing email/phone', () => {
    let capturedFormData: any;
    const TestComponent = () => {
      const { formData } = useNewItemForm();
      capturedFormData = formData;
      return <RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />;
    };
    renderWithFormProvider(<TestComponent />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const emailInput = screen.getByLabelText(/אימייל לקבל תוצאות/);
    fireEvent.change(emailInput, { target: { value: 'context@email.com' } });
    expect(capturedFormData.contactEmail).toBe('context@email.com');
    const phoneInput = screen.getByLabelText(/טלפון ליצירת קשר/);
    fireEvent.change(phoneInput, { target: { value: '050-1234567' } });
    expect(capturedFormData.contactPhone).toBe('050-1234567');
  });

  it('shows required error for restaurantName and submitterName if empty', async () => {
    renderWithFormProvider(<RestaurantDetailsStep setExternalErrors={mockSetExternalErrors} clearExternalErrors={mockClearExternalErrors} errors={{}} />);
    fireEvent.click(screen.getByText('לא, זו פעם ראשונה שלנו'));
    const restaurantInput = screen.getByLabelText(/שם המסעדה/);
    fireEvent.blur(restaurantInput);
    expect(await screen.findByText(/שם המסעדה הוא שדה חובה/)).toBeInTheDocument();
    const submitterInput = screen.getByLabelText(/שם מלא של המגיש/);
    fireEvent.blur(submitterInput);
    expect(await screen.findByText(/שם המגיש הוא שדה חובה/)).toBeInTheDocument();
  });
}); 