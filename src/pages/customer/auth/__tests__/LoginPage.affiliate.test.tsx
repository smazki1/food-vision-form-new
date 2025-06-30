import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import LoginPage from '../LoginPage';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      signInWithPassword: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      })),
      insert: vi.fn()
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

// Mock useNavigate at the module level
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Helper to create test wrapper
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };
};

describe('LoginPage - Affiliate Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Happy Path - Successful Affiliate Login', () => {
    it('should successfully login affiliate with valid credentials', async () => {
      // Mock successful affiliate verification
      const mockAffiliateResult = {
        affiliate_id: 'test-affiliate-id',
        name: 'Test Affiliate',
        email: 'test@affiliate.com',
        is_valid: true
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockAffiliateResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      // Fill in affiliate credentials
      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'validpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/affiliate/dashboard');
      });

      // Verify localStorage session was created
      const storedSession = localStorage.getItem('affiliate_session');
      expect(storedSession).toBeTruthy();
      
      const parsedSession = JSON.parse(storedSession!);
      expect(parsedSession).toEqual({
        affiliate_id: 'test-affiliate-id',
        email: 'test@affiliate.com',
        name: 'Test Affiliate'
      });
    });

    it('should call verify_affiliate_login with correct parameters', async () => {
      const mockAffiliateResult = {
        affiliate_id: 'test-id',
        name: 'Test',
        email: 'test@test.com',
        is_valid: true
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockAffiliateResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('verify_affiliate_login', {
          input_email: 'test@affiliate.com',
          input_password: 'password123'
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty affiliate verification result', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'nonexistent@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Should proceed to regular auth since no affiliate found
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should handle invalid affiliate credentials', async () => {
      const mockInvalidResult = {
        affiliate_id: 'test-id',
        name: 'Test',
        email: 'test@test.com',
        is_valid: false
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockInvalidResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalledWith('/affiliate/dashboard');
      });

      // Should not create localStorage session
      expect(localStorage.getItem('affiliate_session')).toBeNull();
    });

    it('should handle missing affiliate data fields', async () => {
      const mockIncompleteResult = {
        affiliate_id: 'test-id',
        name: null,
        email: 'test@test.com',
        is_valid: true
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockIncompleteResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/affiliate/dashboard');
      });

      // Should still create session with null name
      const storedSession = localStorage.getItem('affiliate_session');
      const parsedSession = JSON.parse(storedSession!);
      expect(parsedSession.name).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle database RPC errors', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Should proceed to regular auth on database error
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });

    it('should handle localStorage errors gracefully', async () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage full');
      });

      const mockAffiliateResult = {
        affiliate_id: 'test-id',
        name: 'Test',
        email: 'test@test.com',
        is_valid: true
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockAffiliateResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Should still attempt navigation even if localStorage fails (handled by try-catch)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/affiliate/dashboard');
      });

      // Restore localStorage
      localStorage.setItem = originalSetItem;
    });

    it('should handle network timeout', async () => {
      (supabase.rpc as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network timeout'));

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Network timeout should be caught by try-catch block and not proceed to regular auth
      // Give a reasonable timeout for the operation to complete
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should handle empty email field', async () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Should not call affiliate verification with empty email due to HTML5 required attribute
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should handle empty password field', async () => {
      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: 'test@affiliate.com' } });
      fireEvent.click(loginButton);

      // Should not call affiliate verification with empty password due to HTML5 required attribute
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('should trim whitespace from email but not password', async () => {
      const mockAffiliateResult = {
        affiliate_id: 'test-id',
        name: 'Test',
        email: 'test@test.com',
        is_valid: true
      };

      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [mockAffiliateResult],
        error: null
      });

      const Wrapper = createTestWrapper();
      const { container } = render(<LoginPage />, { wrapper: Wrapper });

      const emailInput = screen.getByPlaceholderText('name@restaurant.com');
      const passwordInput = screen.getByPlaceholderText('••••••••');
      const loginButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      fireEvent.change(emailInput, { target: { value: '  test@affiliate.com  ' } });
      fireEvent.change(passwordInput, { target: { value: '  password123  ' } });
      fireEvent.click(loginButton);

      // Email inputs are automatically trimmed by browsers, but passwords are not
      await waitFor(() => {
        expect(supabase.rpc).toHaveBeenCalledWith('verify_affiliate_login', {
          input_email: 'test@affiliate.com', // Browser trims email automatically
          input_password: '  password123  '  // Password keeps whitespace
        });
      });
    });
  });
}); 