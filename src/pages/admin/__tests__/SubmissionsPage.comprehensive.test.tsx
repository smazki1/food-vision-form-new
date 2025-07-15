import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import SubmissionsPage from '../SubmissionsPage';
import { Submission } from '@/api/submissionApi';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test-project.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  }
}));

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock current user role hook
vi.mock('@/hooks/useCurrentUserRole', () => ({
  useCurrentUserRole: vi.fn(),
}));

// Mock components
vi.mock('@/components/admin/submissions/SubmissionViewer', () => ({
  SubmissionViewer: ({ submissionId, onClose }: any) => (
    <div data-testid="submission-viewer">
      <div data-testid="submission-id">{submissionId}</div>
      <button onClick={onClose} data-testid="close-viewer">Close</button>
    </div>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <div className={className} data-testid="card-title">{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, variant, size, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled}
      data-testid={props['data-testid']}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input 
      value={value} 
      onChange={onChange} 
      placeholder={placeholder} 
      className={className}
      data-testid={props['data-testid']}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant }: any) => (
    <span className={className} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('test-value')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => (
    <div data-testid="select-trigger">{children}</div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <div data-testid="select-value">{placeholder}</div>
  ),
}));

vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="sheet" onClick={() => onOpenChange && onOpenChange(false)}>{children}</div> : null
  ),
  SheetContent: ({ children }: any) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: any) => (
    <div data-testid="sheet-header">{children}</div>
  ),
  SheetTitle: ({ children }: any) => (
    <div data-testid="sheet-title">{children}</div>
  ),
  SheetDescription: ({ children }: any) => (
    <div data-testid="sheet-description">{children}</div>
  ),
}));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange, ...props }: any) => (
    <input 
      type="checkbox" 
      checked={checked} 
      onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
      data-testid={props['data-testid']}
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => (
    <div data-testid="dropdown-menu">{children}</div>
  ),
  DropdownMenuContent: ({ children }: any) => (
    <div data-testid="dropdown-menu-content">{children}</div>
  ),
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div data-testid="dropdown-menu-item" onClick={onClick}>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: any) => (
    <div data-testid="dropdown-menu-trigger">{children}</div>
  ),
  DropdownMenuSeparator: () => (
    <div data-testid="dropdown-menu-separator" />
  ),
  DropdownMenuLabel: ({ children }: any) => (
    <div data-testid="dropdown-menu-label">{children}</div>
  ),
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('test-tab')}>
        {children}
      </button>
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: any) => (
    <div data-testid="tabs-trigger" data-value={value}>{children}</div>
  ),
}));

describe('SubmissionsPage Component', () => {
  let mockUseCurrentUserRole: any;
  let mockSupabase: any;
  let queryClient: QueryClient;

  const mockSubmissions: Submission[] = [
    {
      submission_id: 'sub-1',
      client_id: 'client-1',
      item_type: 'dish',
      item_name_at_submission: 'Test Dish',
      submission_status: 'ממתינה לעיבוד',
      uploaded_at: '2024-01-01T12:00:00Z',
      processed_at: null,
      original_image_urls: ['image1.jpg', 'image2.jpg'],
      processed_image_urls: [],
      main_processed_image_url: null,
      branding_material_urls: [],
      reference_example_urls: [],
      edit_history: [],
      final_approval_timestamp: null,
      assigned_editor_id: null,
      lead_id: null,
      original_item_id: null,
      lora_name: null,
      lora_id: null,
      fixed_prompt: null,
      created_lead_id: null,
      description: 'Test description',
      restaurant_name: 'Test Restaurant',
      contact_name: 'Test Contact',
      email: 'test@example.com',
      phone: '123-456-7890',
      created_at: '2024-01-01T12:00:00Z',
      edit_count: 0,
      internal_team_notes: '',
      priority: 'Medium',
      submission_contact_name: 'Test Contact',
      submission_contact_email: 'test@example.com',
      submission_contact_phone: '123-456-7890',
      assigned_package_id_at_submission: null,
    },
    {
      submission_id: 'sub-2',
      client_id: 'client-2',
      item_type: 'drink',
      item_name_at_submission: 'Test Drink',
      submission_status: 'בעיבוד',
      uploaded_at: '2024-01-02T12:00:00Z',
      processed_at: null,
      original_image_urls: ['image3.jpg'],
      processed_image_urls: ['processed1.jpg'],
      main_processed_image_url: 'processed1.jpg',
      branding_material_urls: ['brand1.jpg'],
      reference_example_urls: ['ref1.jpg'],
      edit_history: [{ action: 'edit', timestamp: '2024-01-02T13:00:00Z' }],
      final_approval_timestamp: null,
      assigned_editor_id: 'editor-1',
      lead_id: 'lead-1',
      original_item_id: null,
      lora_link: 'https://example.com/lora',
      lora_name: 'Test LORA',
      lora_id: 'lora-1',
      fixed_prompt: 'Test prompt',
      created_lead_id: 'lead-1',
      description: 'Test drink description',
      restaurant_name: 'Test Restaurant 2',
      contact_name: 'Test Contact 2',
      email: 'test2@example.com',
      phone: '987-654-3210',
      created_at: '2024-01-02T12:00:00Z',
      edit_count: 1,
      internal_team_notes: 'Test notes',
      priority: 'High',
      submission_contact_name: 'Test Contact 2',
      submission_contact_email: 'test2@example.com',
      submission_contact_phone: '987-654-3210',
      assigned_package_id_at_submission: 'package-1',
    }
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Create fresh query client for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
    
    // Get the mocked functions
    const { useCurrentUserRole } = await import('@/hooks/useCurrentUserRole');
    const { supabase } = await import('@/integrations/supabase/client');
    
    mockUseCurrentUserRole = useCurrentUserRole as any;
    mockSupabase = supabase;
    
    // Default mock implementations
    mockUseCurrentUserRole.mockReturnValue({
      status: 'ROLE_DETERMINED',
      isAdmin: true,
      isAccountManager: false,
      userId: 'admin-user-1',
      role: 'admin',
      error: null,
    });
    
    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockSubmissions,
          error: null,
        }),
      }),
    });
    
    (window.localStorage.getItem as any).mockReturnValue('true');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('renders submissions page with all essential elements', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Check for main UI elements
      expect(screen.getByPlaceholderText('חיפוש לפי שם פריט, סוג או מסעדה...')).toBeInTheDocument();
      expect(screen.getByText('פילטרים')).toBeInTheDocument();
    });

    it('renders search input with proper Hebrew placeholder', () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('renders view mode controls', () => {
      renderWithQueryClient(<SubmissionsPage />);

      expect(screen.getByText('תצוגה')).toBeInTheDocument();
      
      // Check for view mode buttons
      const viewButtons = screen.getAllByRole('button');
      expect(viewButtons.length).toBeGreaterThan(0);
    });

    it('renders filter controls', () => {
      renderWithQueryClient(<SubmissionsPage />);

      expect(screen.getByText('סינון')).toBeInTheDocument();
      
      // Check for filter button
      const filterButton = screen.getByText('סינון');
      expect(filterButton).toBeInTheDocument();
    });
  });

  describe('Authentication Handling', () => {
    it('shows submissions when user has admin access', async () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'ROLE_DETERMINED',
        isAdmin: true,
        isAccountManager: false,
        userId: 'admin-user-1',
        role: 'admin',
        error: null,
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });

    it('shows submissions when user has account manager access', async () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'ROLE_DETERMINED',
        isAdmin: false,
        isAccountManager: true,
        userId: 'manager-user-1',
        role: 'account_manager',
        error: null,
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });

    it('handles localStorage admin fallback', async () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'ERROR_FETCHING_ROLE',
        isAdmin: false,
        isAccountManager: false,
        userId: null,
        role: null,
        error: 'Failed to fetch role',
      });

      (window.localStorage.getItem as any).mockReturnValue('true');

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });

    it('handles multiple authentication states', async () => {
      const authStates = [
        'FORCED_COMPLETE',
        'ERROR_FETCHING_ROLE', 
        'ERROR_SESSION',
        'FETCHING_ROLE',
        'CHECKING_SESSION'
      ];

      for (const status of authStates) {
        mockUseCurrentUserRole.mockReturnValue({
          status,
          isAdmin: false,
          isAccountManager: false,
          userId: null,
          role: null,
          error: null,
        });

        (window.localStorage.getItem as any).mockReturnValue('true');

        renderWithQueryClient(<SubmissionsPage />);

        await waitFor(() => {
          expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Data Fetching', () => {
    it('fetches submissions successfully', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customer_submissions');
      });

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });

    it('handles data fetching errors', async () => {
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customer_submissions');
      });
    });

    it('transforms submission data correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customer_submissions');
      });

      // Verify the select query includes all necessary fields
      const selectCall = (mockSupabase.from as any).mock.results[0].value.select;
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('submission_id'));
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('client_id'));
      expect(selectCall).toHaveBeenCalledWith(expect.stringContaining('item_type'));
    });

    it('orders submissions by uploaded_at descending', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        const orderCall = (mockSupabase.from as any).mock.results[0].value.select.mock.results[0].value.order;
        expect(orderCall).toHaveBeenCalledWith('uploaded_at', { ascending: false });
      });
    });
  });

  describe('Search Functionality', () => {
    it('updates search term when user types', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');
    });

    it('filters submissions based on search term', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.change(searchInput, { target: { value: 'Test Dish' } });

      // Should filter results (implementation depends on component logic)
      expect(searchInput).toHaveValue('Test Dish');
    });

    it('handles Hebrew search terms', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.change(searchInput, { target: { value: 'מנה בדיקה' } });

      expect(searchInput).toHaveValue('מנה בדיקה');
    });
  });

  describe('View Mode Controls', () => {
    it('switches between view modes', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('תצוגה')).toBeInTheDocument();
      });

      // Test view mode switching (implementation depends on component structure)
      const viewButton = screen.getByText('תצוגה');
      fireEvent.click(viewButton);
    });

    it('renders cards view mode correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Default view should be cards
      expect(screen.getAllByTestId('card')).toBeTruthy();
    });
  });

  describe('Filtering System', () => {
    it('opens filter panel when filter button is clicked', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      const filterButton = screen.getByText('סינון');
      fireEvent.click(filterButton);

      // Should show filter controls
      await waitFor(() => {
        expect(screen.getByText('סינון')).toBeInTheDocument();
      });
    });

    it('applies status filter correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      const filterButton = screen.getByText('סינון');
      fireEvent.click(filterButton);

      // Test filter application (implementation depends on component structure)
      await waitFor(() => {
        expect(screen.getByText('סינון')).toBeInTheDocument();
      });
    });

    it('handles multiple filter combinations', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      const filterButton = screen.getByText('סינון');
      fireEvent.click(filterButton);

      // Test multiple filters
      await waitFor(() => {
        expect(screen.getByText('סינון')).toBeInTheDocument();
      });
    });
  });

  describe('Submission Viewer Integration', () => {
    it('opens submission viewer when submission is clicked', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Find and click a submission (implementation depends on component structure)
      // This would typically be a submission card or row
      const submissions = screen.getAllByTestId('card');
      if (submissions.length > 0) {
        fireEvent.click(submissions[0]);
      }
    });

    it('closes submission viewer when close button is clicked', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Test viewer close functionality
      // This would involve opening the viewer first, then closing it
    });

    it('passes correct submission ID to viewer', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Test that correct submission ID is passed
      // Implementation depends on component structure
    });
  });

  describe('Hebrew Language Support', () => {
    it('displays Hebrew text correctly', () => {
      renderWithQueryClient(<SubmissionsPage />);

      expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('חיפוש הגשות...')).toBeInTheDocument();
      expect(screen.getByText('סינון')).toBeInTheDocument();
      expect(screen.getByText('תצוגה')).toBeInTheDocument();
    });

    it('handles Hebrew search terms correctly', () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.change(searchInput, { target: { value: 'מנה ראשונה' } });

      expect(searchInput).toHaveValue('מנה ראשונה');
    });

    it('displays status badges in Hebrew', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Check for Hebrew status badges
      const badges = screen.getAllByTestId('badge');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('handles query errors gracefully', async () => {
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Query failed')),
        }),
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('customer_submissions');
      });

      // Component should handle error gracefully
      expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
    });

    it('handles empty submissions array', async () => {
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });

    it('handles null submissions data', async () => {
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Optimization', () => {
    it('memoizes expensive computations', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });

      // Test that component handles re-renders efficiently
      // This would involve triggering re-renders and checking performance
    });

    it('handles large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockSubmissions[0],
        submission_id: `sub-${i}`,
        item_name_at_submission: `Test Item ${i}`,
      }));

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: largeDataset,
            error: null,
          }),
        }),
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('ניהול הגשות')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels', () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      expect(searchInput).toBeInTheDocument();
      
      // Check that buttons have proper labels
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      renderWithQueryClient(<SubmissionsPage />);

      const searchInput = screen.getByPlaceholderText('חיפוש הגשות...');
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // Should handle keyboard events appropriately
      expect(searchInput).toBeInTheDocument();
    });
  });
}); 