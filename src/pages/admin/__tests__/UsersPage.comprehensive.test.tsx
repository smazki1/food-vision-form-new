import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { toast } from 'sonner';
import UsersPage from '../UsersPage';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SUPABASE_URL: 'https://test-project.supabase.co'
  }
}));

// Mock the Supabase clients
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              client_id: 'test-client-id',
              user_auth_id: 'new-user',
              restaurant_name: 'Test Restaurant',
              contact_name: 'Test Contact',
              phone: '123456789',
              client_status: 'active'
            }, 
            error: null 
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }))
  }
}));

// Create mock functions to use in tests
const mockCreateUser = vi.fn(() => Promise.resolve({ 
  data: { user: { id: 'new-user', email: 'new@test.com' } }, 
  error: null 
}));

const mockListUsers = vi.fn(() => Promise.resolve({ 
  data: { users: [] }, 
  error: null 
}));

const mockDeleteUser = vi.fn(() => Promise.resolve({ 
  data: null, 
  error: null 
}));

vi.mock('@/integrations/supabase/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: mockListUsers,
        createUser: mockCreateUser,
        deleteUser: mockDeleteUser
      }
    }
  }
}));

// Mock toast with proper spy setup
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock UI components with specific test IDs to avoid conflicts
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid={`card-title-${children?.toString().replace(/\s+/g, '-').toLowerCase()}`}>{children}</h3>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => {
    // Extract text content from children (handle React elements)
    const textContent = typeof children === 'string' ? children : 
      React.Children.toArray(children).filter(child => typeof child === 'string').join(' ');
    
    return (
      <button 
        onClick={onClick} 
        disabled={disabled} 
        data-testid={`button-${textContent.replace(/\s+/g, '-').toLowerCase()}`}
        role="button"
        {...props}
      >
        {children}
      </button>
    );
  },
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, id, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder}
      data-testid={`input-${id || placeholder?.replace(/\s+/g, '-').toLowerCase()}`}
      id={id}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid={`badge-${variant || 'default'}`}>{children}</span>
  ),
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" style={{ display: open ? 'block' : 'none' }}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" onClick={() => onValueChange && onValueChange('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <span data-testid="select-value">{placeholder}</span>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label data-testid={`label-${htmlFor}`} htmlFor={htmlFor}>{children}</label>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-menu-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="dropdown-menu-trigger">{children}</div>,
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h3 data-testid="alert-dialog-title">{children}</h3>,
  AlertDialogDescription: ({ children }: any) => <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button data-testid="alert-dialog-action" onClick={onClick}>{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => <button data-testid="alert-dialog-cancel">{children}</button>,
  AlertDialogTrigger: ({ children }: any) => <div data-testid="alert-dialog-trigger">{children}</div>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => <div data-testid="tabs">{children}</div>,
  TabsContent: ({ children }: any) => <div data-testid="tabs-content">{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: any) => <div data-testid="tabs-trigger">{children}</div>,
}));

describe('UsersPage Comprehensive Tests', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('renders loading state initially', () => {
      renderWithProvider(<UsersPage />);
      expect(screen.getByText('טוען משתמשים...')).toBeInTheDocument();
    });

    it('renders main heading and description', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ניהול משתמשים')).toBeInTheDocument();
        expect(screen.getByText('ניהול חשבונות משתמשים, יצירת לקוחות חדשים ועריכת פרטים')).toBeInTheDocument();
      });
    });

    it('renders create customer button', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('button-לקוח-חדש')).toBeInTheDocument();
      });
    });

    it('renders users table with headers', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('רשימת משתמשים')).toBeInTheDocument();
        expect(screen.getByText('פרטי משתמש')).toBeInTheDocument();
        expect(screen.getByText('תפקיד')).toBeInTheDocument();
        expect(screen.getByText('סטטוס')).toBeInTheDocument();
      });
    });

    it('renders search and filter controls', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('סינון וחיפוש')).toBeInTheDocument();
        expect(screen.getByTestId('input-חיפוש-לפי-אימייל,-שם-מסעדה-או-איש-קשר...')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state message', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
        expect(screen.getByText('0 משתמשים')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Access Management', () => {
    it('opens create customer dialog when button is clicked', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByTestId('button-לקוח-חדש');
        fireEvent.click(createButton);
      });

      expect(screen.getByText('יצירת לקוח חדש')).toBeInTheDocument();
    });

    it('shows required form fields in create dialog', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

              expect(screen.getByTestId('input-email')).toBeInTheDocument();
        expect(screen.getByTestId('input-password')).toBeInTheDocument();
        expect(screen.getByTestId('input-restaurant_name')).toBeInTheDocument();
        expect(screen.getByTestId('input-contact_name')).toBeInTheDocument();
    });

    it('validates form fields on submission', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });
  });

  describe('User Interface Elements', () => {
    it('displays filter and search interface', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('סינון וחיפוש')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('חיפוש לפי אימייל, שם מסעדה או איש קשר...')).toBeInTheDocument();
        expect(screen.getAllByTestId('select')).toHaveLength(3); // Package, role, and status filters
      });
    });

    it('shows table structure', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('table')).toBeInTheDocument();
        expect(screen.getByTestId('table-header')).toBeInTheDocument();
        expect(screen.getByTestId('table-body')).toBeInTheDocument();
      });
    });

    it('displays user count correctly', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('0 משתמשים')).toBeInTheDocument();
      });
    });
  });

  describe('Form Handling', () => {
    it('handles form input changes', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('handles search input changes', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const searchInput = screen.getByTestId('input-חיפוש-לפי-אימייל,-שם-מסעדה-או-איש-קשר...');
        fireEvent.change(searchInput, { target: { value: 'test search' } });
        expect(searchInput).toHaveValue('test search');
      });
    });
  });

  describe('Component State Management', () => {
    it('maintains form state across interactions', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-password');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Error Handling', () => {
    it('handles validation errors properly', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles form submission with partial data', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      // Fill only email field
      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles form validation errors', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles network errors during creation', async () => {
      const mockError = new Error('Network error');
      mockCreateUser.mockRejectedValueOnce(mockError);
      
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-password');
      const restaurantInput = screen.getByTestId('input-restaurant_name');
      const contactInput = screen.getByTestId('input-contact_name');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(restaurantInput, { target: { value: 'Test Restaurant' } });
      fireEvent.change(contactInput, { target: { value: 'John Doe' } });

      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('שגיאה ביצירת חשבון לקוח: Network error');
      });
    });
  });

  describe('Hebrew Language Support', () => {
    it('displays all Hebrew text correctly', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('ניהול משתמשים')).toBeInTheDocument();
        expect(screen.getByTestId('button-לקוח-חדש')).toBeInTheDocument();
        expect(screen.getByText('רשימת משתמשים')).toBeInTheDocument();
        expect(screen.getByText('סינון וחיפוש')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Testing', () => {
    it('integrates with React Query properly', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        expect(screen.getByText('טוען משתמשים...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
      });
    });

    it('handles complete form submission workflow', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByText('לקוח חדש');
        fireEvent.click(createButton);
      });

      // Fill all required fields
      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-password');
      const restaurantInput = screen.getByTestId('input-restaurant_name');
      const contactInput = screen.getByTestId('input-contact_name');

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(restaurantInput, { target: { value: 'Test Restaurant' } });
      fireEvent.change(contactInput, { target: { value: 'Test Contact' } });

      const submitButton = screen.getByText('צור לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith('חשבון לקוח חדש נוצר בהצלחה');
      });
    });
  });

  describe('Advanced Edge Cases', () => {
    it('handles empty form validation', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByTestId('button-לקוח-חדש');
        fireEvent.click(createButton);
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('יצירת לקוח חדש')).toBeInTheDocument();
      });

      const submitButton = screen.getByTestId('button-צור-לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles partial form completion', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByTestId('button-לקוח-חדש');
        fireEvent.click(createButton);
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('יצירת לקוח חדש')).toBeInTheDocument();
      });

      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const submitButton = screen.getByTestId('button-צור-לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles form validation errors', async () => {
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByTestId('button-לקוח-חדש');
        fireEvent.click(createButton);
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('יצירת לקוח חדש')).toBeInTheDocument();
      });

      const emailInput = screen.getByTestId('input-email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByTestId('button-צור-לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('אנא מלא את כל השדות הנדרשים');
      });
    });

    it('handles network errors during creation', async () => {
      const mockError = new Error('Network error');
      mockCreateUser.mockRejectedValueOnce(mockError);
      
      renderWithProvider(<UsersPage />);
      
      await waitFor(() => {
        const createButton = screen.getByTestId('button-לקוח-חדש');
        fireEvent.click(createButton);
      });

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByText('יצירת לקוח חדש')).toBeInTheDocument();
      });

      const emailInput = screen.getByTestId('input-email');
      const passwordInput = screen.getByTestId('input-password');
      const restaurantInput = screen.getByTestId('input-restaurant_name');
      const contactInput = screen.getByTestId('input-contact_name');
      
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(restaurantInput, { target: { value: 'Test Restaurant' } });
      fireEvent.change(contactInput, { target: { value: 'John Doe' } });

      const submitButton = screen.getByTestId('button-צור-לקוח');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(vi.mocked(toast.error)).toHaveBeenCalledWith('שגיאה ביצירת חשבון לקוח: Network error');
      });
    });
  });
}); 