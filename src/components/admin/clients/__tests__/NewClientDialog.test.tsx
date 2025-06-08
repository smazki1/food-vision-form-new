import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewClientDialog } from '../NewClientDialog';

// Mock the useCreateClient hook
vi.mock('@/hooks/useCreateClient', () => ({
  useCreateClient: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ client_id: 'test-id', restaurant_name: 'Test Restaurant' }),
    isPending: false,
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NewClientDialog', () => {
  let queryClient: QueryClient;
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (open = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NewClientDialog open={open} onOpenChange={mockOnOpenChange} />
      </QueryClientProvider>
    );
  };

  it('should render the dialog when open', () => {
    renderComponent(true);
    
    expect(screen.getByText('הוספת לקוח חדש')).toBeInTheDocument();
    expect(screen.getByText('מלא את הפרטים ליצירת לקוח חדש במערכת. שדות עם כוכבית (*) הם חובה.')).toBeInTheDocument();
  });

  it('should not render the dialog when closed', () => {
    renderComponent(false);
    
    expect(screen.queryByText('הוספת לקוח חדש')).not.toBeInTheDocument();
  });

  it('should render all required form fields', () => {
    renderComponent(true);
    
    expect(screen.getByLabelText(/שם המסעדה\/עסק/)).toBeInTheDocument();
    expect(screen.getByLabelText(/איש קשר/)).toBeInTheDocument();
    expect(screen.getByLabelText(/טלפון/)).toBeInTheDocument();
    expect(screen.getByLabelText(/אימייל/)).toBeInTheDocument();
    expect(screen.getByLabelText(/סוג עסק/)).toBeInTheDocument();
    expect(screen.getByLabelText(/סטטוס/)).toBeInTheDocument();
  });

  it('should show validation errors for required fields', async () => {
    renderComponent(true);
    
    const submitButton = screen.getByText('צור לקוח');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('שם המסעדה הוא שדה חובה')).toBeInTheDocument();
      expect(screen.getByText('שם איש הקשר הוא שדה חובה')).toBeInTheDocument();
      expect(screen.getByText('מספר טלפון חייב להכיל לפחות 9 ספרות')).toBeInTheDocument();
      expect(screen.getByText('כתובת אימייל לא תקינה')).toBeInTheDocument();
    });
  });

  it('should call onOpenChange when cancel button is clicked', () => {
    renderComponent(true);
    
    const cancelButton = screen.getByText('ביטול');
    fireEvent.click(cancelButton);
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('should have default values set correctly', () => {
    renderComponent(true);
    
    const statusSelect = screen.getByDisplayValue('פעיל');
    expect(statusSelect).toBeInTheDocument();
    
    const emailNotifications = screen.getByRole('checkbox', { name: /קבלת התראות באימייל/ });
    const appNotifications = screen.getByRole('checkbox', { name: /קבלת התראות באפליקציה/ });
    
    expect(emailNotifications).toBeChecked();
    expect(appNotifications).toBeChecked();
  });

  it('should exclude archive status from status options', () => {
    renderComponent(true);
    
    // Click on status select to open dropdown
    const statusSelect = screen.getByRole('combobox');
    fireEvent.click(statusSelect);
    
    // Archive status should not be available for new clients
    expect(screen.queryByText('ארכיון')).not.toBeInTheDocument();
    
    // But other statuses should be available
    expect(screen.getByText('פעיל')).toBeInTheDocument();
    expect(screen.getByText('לא פעיל')).toBeInTheDocument();
    expect(screen.getByText('בהמתנה')).toBeInTheDocument();
  });
}); 