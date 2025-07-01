import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AffiliateDetailPanel } from '../AffiliateDetailPanel';

// Mock all the hooks
vi.mock('@/hooks/useAffiliate', () => ({
  useAffiliate: vi.fn(),
  useAffiliateClients: vi.fn(),
  useAffiliatePackages: vi.fn(),
  useAffiliateCommissions: vi.fn(),
  useAffiliateDashboard: vi.fn(),
  useUpdateAffiliate: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ children, open }: any) => open ? <div data-testid="sheet">{children}</div> : null,
  SheetContent: ({ children }: any) => <div data-testid="sheet-content">{children}</div>,
  SheetHeader: ({ children }: any) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children }: any) => <h1 data-testid="sheet-title">{children}</h1>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>,
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-testid={props['data-testid'] || 'button'}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className }: any) => (
    <span data-testid="badge" className={className}>{children}</span>
  ),
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, ...props }: any) => (
    <textarea 
      value={value} 
      onChange={onChange}
      data-testid="textarea"
      {...props}
    />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange && onValueChange('active')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid={`select-item-${value}`}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <span data-testid="select-value">Current Value</span>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children }: any) => <td data-testid="table-cell">{children}</td>,
  TableHead: ({ children }: any) => <th data-testid="table-head">{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children }: any) => <tr data-testid="table-row">{children}</tr>,
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label data-testid="label">{children}</label>,
}));

vi.mock('@/utils/formatters', () => ({
  formatCurrency: vi.fn((amount) => `₪${amount}`),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Import the mocked hooks
import { 
  useAffiliate, 
  useAffiliateClients, 
  useAffiliatePackages, 
  useAffiliateCommissions,
  useAffiliateDashboard,
  useUpdateAffiliate
} from '@/hooks/useAffiliate';

const mockUseAffiliate = useAffiliate as any;
const mockUseAffiliateClients = useAffiliateClients as any;
const mockUseAffiliatePackages = useAffiliatePackages as any;
const mockUseAffiliateCommissions = useAffiliateCommissions as any;
const mockUseAffiliateDashboard = useAffiliateDashboard as any;
const mockUseUpdateAffiliate = useUpdateAffiliate as any;

// Mock data
const mockAffiliate = {
  affiliate_id: 'test-affiliate-1',
  name: 'Test Affiliate',
  email: 'test@example.com',
  phone: '123-456-7890',
  status: 'active',
  commission_rate_tasting: 30,
  commission_rate_full_menu: 25,
  commission_rate_deluxe: 20,
  total_earnings: 1500,
  total_referrals: 5,
  username: 'testuser',
  password: 'testpass123',
  created_at: '2024-01-01T00:00:00Z',
  internal_notes: 'Test notes'
};

const mockClients = [
  {
    id: 'client-1',
    status: 'active',
    referred_at: '2024-01-15T00:00:00Z',
    referral_source: 'direct',
    client: {
      restaurant_name: 'Test Restaurant',
      contact_name: 'John Doe',
      email: 'john@test.com'
    }
  }
];

const mockPackages = [
  {
    package_id: 'pkg-1',
    package_type: 'Premium Package',
    status: 'active',
    purchased_at: '2024-01-10T00:00:00Z',
    total_dishes: 20,
    used_dishes: 5,
    remaining_dishes: 15,
    total_images: 100,
    used_images: 25,
    remaining_images: 75,
    purchase_price: 299
  }
];

const mockCommissions = [
  {
    commission_id: 'comm-1',
    created_at: '2024-01-20T00:00:00Z',
    transaction_type: 'package_sale',
    base_amount: 299,
    commission_rate: 25,
    commission_amount: 74.75,
    payment_status: 'paid'
  }
];

const mockDashboardStats = {
  total_earnings: 1500,
  pending_commissions: 150,
  total_clients: 5,
  active_clients: 3
};

describe('AffiliateDetailPanel', () => {
  let queryClient: QueryClient;
  let mockMutateAsync: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockMutateAsync = vi.fn();

    // Setup default mock returns
    mockUseAffiliate.mockReturnValue({
      data: mockAffiliate,
      isLoading: false,
      error: null
    });

    mockUseAffiliateClients.mockReturnValue({
      data: mockClients,
      isLoading: false,
      error: null
    });

    mockUseAffiliatePackages.mockReturnValue({
      data: mockPackages,
      isLoading: false,
      error: null
    });

    mockUseAffiliateCommissions.mockReturnValue({
      data: mockCommissions,
      isLoading: false,
      error: null
    });

    mockUseAffiliateDashboard.mockReturnValue({
      data: mockDashboardStats,
      isLoading: false,
      error: null
    });

    mockUseUpdateAffiliate.mockReturnValue({
      mutateAsync: mockMutateAsync
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      affiliateId: 'test-affiliate-1',
      isOpen: true,
      onClose: vi.fn()
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <AffiliateDetailPanel {...defaultProps} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Component Rendering', () => {
    it('should render nothing when isOpen is false', () => {
      renderComponent({ isOpen: false });
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });

    it('should render nothing when affiliateId is null', () => {
      renderComponent({ affiliateId: null });
      expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
    });

    it('should show loading state when affiliate data is loading', () => {
      mockUseAffiliate.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      renderComponent();
      
      expect(screen.getByTestId('sheet')).toBeInTheDocument();
      expect(screen.getByText(/טוען/)).toBeInTheDocument();
    });

    it('should show error state when affiliate is not found', () => {
      mockUseAffiliate.mockReturnValue({
        data: null,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      expect(screen.getByText('שותף לא נמצא')).toBeInTheDocument();
    });

    it('should render affiliate details when data is available', () => {
      renderComponent();
      
      expect(screen.getByTestId('sheet-title')).toHaveTextContent('Test Affiliate');
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });

  describe('Status Management', () => {
    it('should display correct status badge for active affiliate', () => {
      renderComponent();
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.some(badge => badge.textContent === 'פעיל')).toBe(true);
    });

    it('should display correct status badge for inactive affiliate', () => {
      const inactiveAffiliate = { ...mockAffiliate, status: 'inactive' };
      mockUseAffiliate.mockReturnValue({
        data: inactiveAffiliate,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.some(badge => badge.textContent === 'לא פעיל')).toBe(true);
    });

    it('should display correct status badge for suspended affiliate', () => {
      const suspendedAffiliate = { ...mockAffiliate, status: 'suspended' };
      mockUseAffiliate.mockReturnValue({
        data: suspendedAffiliate,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.some(badge => badge.textContent === 'מושעה')).toBe(true);
    });

    it('should handle status change successfully', async () => {
      mockMutateAsync.mockResolvedValue({});
      
      renderComponent();
      
      const selectComponent = screen.getByTestId('select');
      fireEvent.click(selectComponent.querySelector('button')!);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          affiliateId: 'test-affiliate-1',
          updates: { status: 'active' }
        });
      });

      expect(toast.success).toHaveBeenCalledWith('סטטוס עודכן בהצלחה');
    });

    it('should handle status change error', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Network error'));
      
      renderComponent();
      
      const selectComponent = screen.getByTestId('select');
      fireEvent.click(selectComponent.querySelector('button')!);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון סטטוס');
      });
    });
  });

  describe('Notes Management', () => {
    it('should initialize notes from affiliate data', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-notes'));
      
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveValue('Test notes');
    });

    it('should update notes when typing', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-notes'));
      
      const textarea = screen.getByTestId('textarea');
      fireEvent.change(textarea, { target: { value: 'Updated notes' } });
      
      expect(textarea).toHaveValue('Updated notes');
    });

    it('should save notes successfully', async () => {
      mockMutateAsync.mockResolvedValue({});
      
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-notes'));
      
      const textarea = screen.getByTestId('textarea');
      fireEvent.change(textarea, { target: { value: 'New notes' } });
      
      const saveButton = screen.getByText('שמור הערות').closest('button');
      fireEvent.click(saveButton!);
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          affiliateId: 'test-affiliate-1',
          updates: { internal_notes: 'New notes' }
        });
      });

      expect(toast.success).toHaveBeenCalledWith('הערות עודכנו בהצלחה');
    });

    it('should handle notes save error', async () => {
      mockMutateAsync.mockRejectedValue(new Error('Save failed'));
      
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-notes'));
      
      const saveButton = screen.getByText('שמור הערות').closest('button');
      fireEvent.click(saveButton!);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('שגיאה בעדכון הערות');
      });
    });

    it('should show loading state when saving notes', async () => {
      let resolvePromise: any;
      const promise = new Promise(resolve => { resolvePromise = resolve; });
      mockMutateAsync.mockReturnValue(promise);
      
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-notes'));
      
      const saveButton = screen.getByText('שמור הערות').closest('button');
      fireEvent.click(saveButton!);
      
      expect(screen.getByText('שומר...')).toBeInTheDocument();
      
      resolvePromise({});
      await waitFor(() => {
        expect(screen.getByText('שמור הערות')).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('should display affiliate basic information', () => {
      renderComponent();
      
      expect(screen.getByText('Test Affiliate')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('123-456-7890')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    it('should display commission rates', () => {
      renderComponent();
      
      // Check commission rates are displayed (multiple instances may exist)
      expect(screen.getAllByText('30%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('25%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('20%').length).toBeGreaterThan(0);
    });

    it('should display dashboard statistics', () => {
      renderComponent();
      
      // Check dashboard stats are displayed (multiple instances may exist)
      expect(screen.getAllByText('₪1500').length).toBeGreaterThan(0);
      expect(screen.getAllByText('₪150').length).toBeGreaterThan(0);
      expect(screen.getAllByText('5').length).toBeGreaterThan(0);
      expect(screen.getAllByText('3').length).toBeGreaterThan(0);
    });

    it('should handle missing phone number gracefully', () => {
      const affiliateWithoutPhone = { ...mockAffiliate, phone: null };
      mockUseAffiliate.mockReturnValue({
        data: affiliateWithoutPhone,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      expect(screen.getAllByText('לא הוזן').length).toBeGreaterThan(0);
    });
  });

  describe('Clients Tab', () => {
    it('should display clients table when data is available', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-clients'));
      
      // Check for specific client data that uniquely identifies the clients table
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('john@test.com')).toBeInTheDocument();
      expect(screen.getByText('direct')).toBeInTheDocument();
    });

    it('should show loading state for clients', () => {
      mockUseAffiliateClients.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-clients'));
      
      expect(screen.getByText('טוען לקוחות...')).toBeInTheDocument();
    });

    it('should show empty state when no clients', () => {
      mockUseAffiliateClients.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-clients'));
      
      expect(screen.getByText('אין לקוחות רשומים')).toBeInTheDocument();
    });
  });

  describe('Packages Tab', () => {
    it('should display packages when data is available', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-packages'));
      
      // Check for specific package data that uniquely identifies the packages
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.getAllByText('₪299').length).toBeGreaterThan(0);
      expect(screen.getByText('15')).toBeInTheDocument(); // remaining dishes
      expect(screen.getByText('75')).toBeInTheDocument(); // remaining images
    });

    it('should show loading state for packages', () => {
      mockUseAffiliatePackages.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-packages'));
      
      expect(screen.getByText('טוען חבילות...')).toBeInTheDocument();
    });

    it('should show empty state when no packages', () => {
      mockUseAffiliatePackages.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-packages'));
      
      expect(screen.getByText('אין חבילות רכושות')).toBeInTheDocument();
    });
  });

  describe('Commissions Tab', () => {
    it('should display commissions table when data is available', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-commissions'));
      
      // Check for specific commission data that uniquely identifies the commissions table
      expect(screen.getByText('package_sale')).toBeInTheDocument();
      expect(screen.getByText('₪74.75')).toBeInTheDocument();
      expect(screen.getByText('20.1.2024')).toBeInTheDocument();
    });

    it('should show loading state for commissions', () => {
      mockUseAffiliateCommissions.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-commissions'));
      
      expect(screen.getByText('טוען עמלות...')).toBeInTheDocument();
    });

    it('should show empty state when no commissions', () => {
      mockUseAffiliateCommissions.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-commissions'));
      
      expect(screen.getByText('אין עמלות רשומות')).toBeInTheDocument();
    });
  });

  describe('Tools Tab', () => {
    it('should display disabled tool buttons', () => {
      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-tools'));
      
      // Check that tool buttons are rendered (disabled state)
      const buttons = screen.getAllByTestId('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined affiliate data gracefully', () => {
      mockUseAffiliate.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      expect(screen.getByText('שותף לא נמצא')).toBeInTheDocument();
    });

    it('should handle empty strings in affiliate data', () => {
      const affiliateWithEmptyStrings = {
        ...mockAffiliate,
        phone: '',
        username: '',
        password: '',
        internal_notes: ''
      };
      
      mockUseAffiliate.mockReturnValue({
        data: affiliateWithEmptyStrings,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      expect(screen.getAllByText('לא הוזן').length).toBeGreaterThan(0);
      expect(screen.getAllByText('לא הוגדר').length).toBeGreaterThan(0);
    });

    it('should handle unknown status values', () => {
      const affiliateWithUnknownStatus = { ...mockAffiliate, status: 'unknown_status' };
      mockUseAffiliate.mockReturnValue({
        data: affiliateWithUnknownStatus,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      const badges = screen.getAllByTestId('badge');
      expect(badges.some(badge => badge.textContent === 'unknown_status')).toBe(true);
    });

    it('should handle missing nested client data', () => {
      const clientsWithMissingData = [
        {
          id: 'client-1',
          status: 'active',
          referred_at: '2024-01-15T00:00:00Z',
          referral_source: 'direct',
          client: null
        }
      ];

      mockUseAffiliateClients.mockReturnValue({
        data: clientsWithMissingData,
        isLoading: false,
        error: null
      });

      renderComponent();
      
      fireEvent.click(screen.getByTestId('tab-trigger-clients'));
      
      expect(screen.getAllByText('שם לא זמין').length).toBeGreaterThan(0);
      expect(screen.getAllByText('אימייל לא זמין').length).toBeGreaterThan(0);
    });
  });
}); 