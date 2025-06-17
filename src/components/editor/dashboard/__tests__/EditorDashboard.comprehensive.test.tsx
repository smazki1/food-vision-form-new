import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EditorDashboardWireframe from '../EditorDashboardWireframe';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    },
    from: vi.fn()
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

vi.mock('@/utils/formatDate', () => ({
  formatDate: vi.fn((date) => new Date(date).toLocaleDateString('en-US'))
}));

// Mock UI components
vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => <div data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
  AlertTitle: ({ children }: any) => <div data-testid="alert-title">{children}</div>
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => <span data-testid="badge" data-variant={variant}>{children}</span>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button data-testid="button" onClick={onClick} {...props}>{children}</button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input 
      data-testid="input" 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      {...props} 
    />
  )
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('test-value')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }: any) => <div data-testid="select-value">{placeholder}</div>
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children, className, onClick }: any) => (
    <td data-testid="table-cell" className={className} onClick={onClick}>{children}</td>
  ),
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children, className, onClick }: any) => (
    <tr data-testid="table-row" className={className} onClick={onClick}>{children}</tr>
  )
}));

// Test data
const mockSubmissions = [
  {
    submission_id: '1',
    item_name_at_submission: 'Tropical Burger',
    submission_status: 'ממתינה לעיבוד',
    uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_editor_id: 'editor-1',
    clients: { restaurant_name: 'Sea Restaurant' }
  },
  {
    submission_id: '2',
    item_name_at_submission: 'Margherita Pizza',
    submission_status: 'בעיבוד',
    uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    assigned_editor_id: 'editor-1',
    clients: { restaurant_name: 'Roma Pizzeria' }
  }
];

const mockSession = {
  user: { id: 'editor-1' }
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('EditorDashboard - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Happy Path Tests', () => {
    it('should render dashboard with submissions successfully', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSubmissions,
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Tropical Burger')).toBeInTheDocument();
      expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    });

    it('should navigate to submission when row is clicked', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSubmissions,
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });

      const tableRows = screen.getAllByTestId('table-row');
      const submissionRow = tableRows.find(row => 
        row.textContent?.includes('Tropical Burger')
      );
      
      if (submissionRow) {
        fireEvent.click(submissionRow);
        expect(mockNavigate).toHaveBeenCalledWith('/editor/submissions/1');
      }
    });

    it('should filter submissions by search term', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockSubmissions,
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by item name/restaurant...');
      fireEvent.change(searchInput, { target: { value: 'Burger' } });

      expect(screen.getByText('Tropical Burger')).toBeInTheDocument();
      expect(screen.queryByText('Margherita Pizza')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty submissions list', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('No tasks found matching your search')).toBeInTheDocument();
    });

    it('should handle submissions without uploaded_at date', async () => {
      const submissionsWithoutDate = [
        {
          ...mockSubmissions[0],
          uploaded_at: null
        }
      ];

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: submissionsWithoutDate,
            error: null
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Tropical Burger')).toBeInTheDocument();
      expect(screen.getByText('Not set')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Not authenticated'))
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });

    it('should handle database connection errors', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: mockSession }
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Error loading tasks')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state initially', () => {
      (supabase.auth.getSession as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { session: mockSession } }), 100))
      );

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockImplementation(() => 
            new Promise(resolve => setTimeout(() => resolve({ data: mockSubmissions, error: null }), 100))
          )
        })
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect
      });

      renderWithProviders(<EditorDashboardWireframe />);

      expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
    });
  });
}); 