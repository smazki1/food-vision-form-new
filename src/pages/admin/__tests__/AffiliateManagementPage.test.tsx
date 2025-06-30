import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import React from 'react';
import AffiliateManagementPage from '../AffiliateManagementPage';
import { useAffiliates, useCreateAffiliate, useDeleteAffiliate } from '@/hooks/useAffiliate';
import type { Affiliate } from '@/types/affiliate';

// Mock the hooks
vi.mock('@/hooks/useAffiliate', () => ({
  useAffiliates: vi.fn(),
  useCreateAffiliate: vi.fn(),
  useDeleteAffiliate: vi.fn()
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock formatCurrency utility
vi.mock('@/utils/formatters', () => ({
  formatCurrency: (amount: number) => `₪${amount.toLocaleString()}`
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className, variant }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-variant={variant}
      data-testid="button"
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  )
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open}>
      {children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
  DialogTrigger: ({ children }: any) => <div data-testid="dialog-trigger">{children}</div>
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      data-testid="input"
      {...props}
    />
  )
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid="label">{children}</label>
  )
}));

vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children }: any) => <div data-testid="alert-dialog">{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="alert-dialog-action">{children}</button>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
  AlertDialogTrigger: ({ children }: any) => <div data-testid="alert-dialog-trigger">{children}</div>
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Mail: () => <div data-testid="mail-icon" />,
  Phone: () => <div data-testid="phone-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  User: () => <div data-testid="user-icon" />
}));

const mockAffiliates: Affiliate[] = [
  {
    affiliate_id: 'aff-1',
    user_auth_id: null,
    name: 'John Doe Affiliate',
    email: 'john@affiliate.com',
    phone: '+972501234567',
    status: 'active',
    commission_rate_tasting: 30,
    commission_rate_full_menu: 25,
    commission_rate_deluxe: 20,
    total_earnings: 1500,
    total_referrals: 8,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    affiliate_id: 'aff-2',
    user_auth_id: null,
    name: 'Jane Smith Marketing',
    email: 'jane@marketing.com',
    phone: '+972509876543',
    status: 'active',
    commission_rate_tasting: 35,
    commission_rate_full_menu: 30,
    commission_rate_deluxe: 25,
    total_earnings: 2750,
    total_referrals: 12,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  }
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('AffiliateManagementPage', () => {
  const mockUseAffiliates = vi.mocked(useAffiliates);
  const mockUseCreateAffiliate = vi.mocked(useCreateAffiliate);
  const mockUseDeleteAffiliate = vi.mocked(useDeleteAffiliate);

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseAffiliates.mockReturnValue({
      data: mockAffiliates,
      isLoading: false,
      error: null
    } as any);

    mockUseCreateAffiliate.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null
    } as any);

    mockUseDeleteAffiliate.mockReturnValue({
      mutate: vi.fn(),
      isLoading: false,
      error: null
    } as any);
  });

  describe('Component Rendering', () => {
    it('should render affiliate management page successfully', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('ניהול שותפים')).toBeInTheDocument();
      expect(screen.getByText('ניהול מערכת השותפים והפניות')).toBeInTheDocument();
      expect(screen.getByText('הוסף שותף חדש')).toBeInTheDocument();
    });

    it('should display statistics correctly', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('סך השותפים')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total affiliates

      expect(screen.getByText('סך הרווחים')).toBeInTheDocument();
      expect(screen.getByText('₪4,250')).toBeInTheDocument(); // 1500 + 2750

      expect(screen.getByText('סך הפניות')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument(); // 8 + 12
    });

    it('should display affiliate cards with correct information', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Check first affiliate
      expect(screen.getByText('John Doe Affiliate')).toBeInTheDocument();
      expect(screen.getByText('john@affiliate.com')).toBeInTheDocument();
      expect(screen.getByText('+972501234567')).toBeInTheDocument();
      expect(screen.getByText('₪1,500')).toBeInTheDocument();
      expect(screen.getByText('8 הפניות')).toBeInTheDocument();

      // Check second affiliate
      expect(screen.getByText('Jane Smith Marketing')).toBeInTheDocument();
      expect(screen.getByText('jane@marketing.com')).toBeInTheDocument();
      expect(screen.getByText('₪2,750')).toBeInTheDocument();
      expect(screen.getByText('12 הפניות')).toBeInTheDocument();
    });

    it('should show commission rates for each affiliate', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // First affiliate rates
      expect(screen.getByText('טעימה: 30%')).toBeInTheDocument();
      expect(screen.getByText('מלא: 25%')).toBeInTheDocument();
      expect(screen.getByText('דלוקס: 20%')).toBeInTheDocument();

      // Second affiliate rates
      expect(screen.getByText('טעימה: 35%')).toBeInTheDocument();
      expect(screen.getByText('מלא: 30%')).toBeInTheDocument();
      expect(screen.getByText('דלוקס: 25%')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading state when fetching affiliates', () => {
      mockUseAffiliates.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('should show create loading state', () => {
      mockUseCreateAffiliate.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Create dialog should show loading state
      const createButtons = screen.getAllByText('יצירה');
      const loadingButton = createButtons.find(button => 
        button.closest('[data-testid="button"]')?.hasAttribute('disabled')
      );
      expect(loadingButton).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle affiliates fetch error', () => {
      const mockError = new Error('Database connection failed');
      mockUseAffiliates.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('שגיאה בטעינת השותפים')).toBeInTheDocument();
      expect(screen.getByText('Database connection failed')).toBeInTheDocument();
    });

    it('should show create error state', () => {
      const mockError = new Error('Email already exists');
      mockUseCreateAffiliate.mockReturnValue({
        mutate: vi.fn(),
        isLoading: false,
        error: mockError
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('שגיאה ביצירת שותף: Email already exists')).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no affiliates exist', () => {
      mockUseAffiliates.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('אין שותפים במערכת')).toBeInTheDocument();
      expect(screen.getByText('צור שותף ראשון כדי להתחיל')).toBeInTheDocument();
    });

    it('should show zero statistics for empty affiliates', () => {
      mockUseAffiliates.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('0')).toBeInTheDocument(); // Total affiliates
      expect(screen.getByText('₪0')).toBeInTheDocument(); // Total earnings
    });
  });

  describe('Create Affiliate Form', () => {
    it('should handle form submission correctly', async () => {
      const mockMutate = vi.fn();
      mockUseCreateAffiliate.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Open create dialog
      const createButton = screen.getByText('הוסף שותף חדש');
      fireEvent.click(createButton);

      // Fill form fields
      const nameInput = screen.getByPlaceholderText('שם השותף');
      const emailInput = screen.getByPlaceholderText('כתובת אימייל');
      const phoneInput = screen.getByPlaceholderText('מספר טלפון');

      fireEvent.change(nameInput, { target: { value: 'New Affiliate' } });
      fireEvent.change(emailInput, { target: { value: 'new@affiliate.com' } });
      fireEvent.change(phoneInput, { target: { value: '+972501111111' } });

      // Submit form
      const submitButton = screen.getByText('יצירה');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          name: 'New Affiliate',
          email: 'new@affiliate.com',
          phone: '+972501111111',
          commission_rate_tasting: 30,
          commission_rate_full_menu: 25,  
          commission_rate_deluxe: 20
        });
      });
    });

    it('should handle custom commission rates', async () => {
      const mockMutate = vi.fn();
      mockUseCreateAffiliate.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Open create dialog
      const createButton = screen.getByText('הוסף שותף חדש');
      fireEvent.click(createButton);

      // Fill form with custom rates
      const nameInput = screen.getByPlaceholderText('שם השותף');
      const emailInput = screen.getByPlaceholderText('כתובת אימייל');
      const tastingRateInput = screen.getByPlaceholderText('30');
      const fullMenuRateInput = screen.getByPlaceholderText('25');
      const deluxeRateInput = screen.getByPlaceholderText('20');

      fireEvent.change(nameInput, { target: { value: 'Premium Affiliate' } });
      fireEvent.change(emailInput, { target: { value: 'premium@affiliate.com' } });
      fireEvent.change(tastingRateInput, { target: { value: '35' } });
      fireEvent.change(fullMenuRateInput, { target: { value: '30' } });
      fireEvent.change(deluxeRateInput, { target: { value: '25' } });

      const submitButton = screen.getByText('יצירה');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith({
          name: 'Premium Affiliate',
          email: 'premium@affiliate.com',
          phone: '',
          commission_rate_tasting: 35,
          commission_rate_full_menu: 30,
          commission_rate_deluxe: 25
        });
      });
    });

    it('should validate required fields', async () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Open create dialog
      const createButton = screen.getByText('הוסף שותף חדש');
      fireEvent.click(createButton);

      // Try to submit without filling required fields
      const submitButton = screen.getByText('יצירה');
      fireEvent.click(submitButton);

      // Form should not submit
      expect(mockUseCreateAffiliate().mutate).not.toHaveBeenCalled();
    });
  });

  describe('Delete Affiliate', () => {
    it('should handle affiliate deletion', async () => {
      const mockMutate = vi.fn();
      mockUseDeleteAffiliate.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Find and click delete button for first affiliate
      const deleteButtons = screen.getAllByTestId('trash2-icon');
      const firstDeleteButton = deleteButtons[0].closest('button');
      fireEvent.click(firstDeleteButton!);

      // Confirm deletion
      const confirmButton = screen.getByText('מחק');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith('aff-1');
      });
    });

    it('should show delete loading state', () => {
      mockUseDeleteAffiliate.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Delete buttons should be disabled during loading
      const deleteButtons = screen.getAllByTestId('trash2-icon');
      const firstDeleteButton = deleteButtons[0].closest('button');
      expect(firstDeleteButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle affiliate with null phone number', () => {
      const affiliateWithNullPhone = {
        ...mockAffiliates[0],
        phone: null
      };

      mockUseAffiliates.mockReturnValue({
        data: [affiliateWithNullPhone],
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Should not crash and should not display phone
      expect(screen.getByText('John Doe Affiliate')).toBeInTheDocument();
      expect(screen.queryByText('+972501234567')).not.toBeInTheDocument();
    });

    it('should handle very large earnings numbers', () => {
      const affiliateWithLargeEarnings = {
        ...mockAffiliates[0],
        total_earnings: 999999999
      };

      mockUseAffiliates.mockReturnValue({
        data: [affiliateWithLargeEarnings],
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('₪999,999,999')).toBeInTheDocument();
    });

    it('should handle zero commission rates', () => {
      const affiliateWithZeroRates = {
        ...mockAffiliates[0],
        commission_rate_tasting: 0,
        commission_rate_full_menu: 0,
        commission_rate_deluxe: 0
      };

      mockUseAffiliates.mockReturnValue({
        data: [affiliateWithZeroRates],
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('טעימה: 0%')).toBeInTheDocument();
      expect(screen.getByText('מלא: 0%')).toBeInTheDocument();
      expect(screen.getByText('דלוקס: 0%')).toBeInTheDocument();
    });

    it('should handle undefined data gracefully', () => {
      mockUseAffiliates.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null
      } as any);

      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Should show empty state instead of crashing
      expect(screen.getByText('אין שותפים במערכת')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels and roles', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      // Check for proper heading structure
      expect(screen.getByText('ניהול שותפים')).toBeInTheDocument();
      
      // Check for button accessibility
      const createButton = screen.getByText('הוסף שותף חדש');
      expect(createButton.closest('button')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<AffiliateManagementPage />, { wrapper: createWrapper() });

      const createButton = screen.getByText('הוסף שותף חדש');
      createButton.focus();
      expect(document.activeElement).toBe(createButton);
    });
  });
}); 