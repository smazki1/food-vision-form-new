import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import LoginPage from '../LoginPage';
import { toast } from 'sonner';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSignIn = vi.fn();
const mockResetPassword = vi.fn();
vi.mock('@/hooks/useUnifiedAuth', () => ({
  useUnifiedAuth: () => ({
    signIn: mockSignIn,
    resetPassword: mockResetPassword,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Create mock functions
const mockSignInWithPassword = vi.fn();
const mockRpcGetMyRole = vi.fn();
const mockFromSelect = vi.fn();
const mockInsert = vi.fn();

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
    rpc: mockRpcGetMyRole,
    from: () => ({
      select: mockFromSelect,
      insert: mockInsert,
    }),
  },
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Happy Path Tests', () => {
    test('renders login page with correct elements', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('Food Vision')).toBeInTheDocument();
      expect(screen.getByText('התחברות')).toBeInTheDocument();
      expect(screen.getByText('הגשה למסעדה קיימת')).toBeInTheDocument();
    });

    test('displays login form by default', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByText('ברוכות הבאות!')).toBeInTheDocument();
      expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
      expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'התחברות' })).toBeInTheDocument();
    });

    test('switches to submission tab correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const submissionTab = screen.getByText('הגשה למסעדה קיימת');
      fireEvent.click(submissionTab);

      expect(screen.getByText('לחץ/י כאן למעבר לטופס')).toBeInTheDocument();
    });

    test('submission button navigates to public upload', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Switch to submission tab
      fireEvent.click(screen.getByText('הגשה למסעדה קיימת'));
      
      // Click submission button
      const submitBtn = screen.getByText('לחץ/י כאן למעבר לטופס');
      fireEvent.click(submitBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/public-upload');
    });
  });

  describe('Authentication Flow Tests', () => {
    test('successful admin login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123', email: 'admin@test.com' } },
        error: null,
      });
      mockRpcGetMyRole.mockResolvedValue({
        data: 'admin',
        error: null,
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      // Fill in login form
      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'admin@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('התחברות אדמין בוצעה בהצלחה!');
        expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
      });
    });

    test('successful editor login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123', email: 'editor@test.com' } },
        error: null,
      });
      mockRpcGetMyRole.mockResolvedValue({
        data: 'editor',
        error: null,
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'editor@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('התחברות עורך בוצעה בהצלחה!');
        expect(mockNavigate).toHaveBeenCalledWith('/editor/dashboard');
      });
    });

    test('successful client login', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123', email: 'client@test.com' } },
        error: null,
      });
      mockRpcGetMyRole.mockResolvedValue({
        data: null,
        error: null,
      });
      mockFromSelect.mockReturnValue({
        eq: () => ({
          single: () => Promise.resolve({
            data: { client_id: 'client123' },
            error: null,
          }),
        }),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'client@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('התחברות לקוח בוצעה בהצלחה!');
        expect(mockNavigate).toHaveBeenCalledWith('/customer/dashboard');
      });
    });

    test('existing lead login redirects to submission', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123', email: 'lead@test.com' } },
        error: null,
      });
      mockRpcGetMyRole.mockResolvedValue({
        data: null,
        error: null,
      });
      
      // Mock client check to return no results
      mockFromSelect
        .mockReturnValueOnce({
          eq: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        })
        // Mock lead check to return existing lead
        .mockReturnValueOnce({
          eq: () => ({
            single: () => Promise.resolve({
              data: { lead_id: 'lead123' },
              error: null,
            }),
          }),
        });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'lead@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('נמצאת כליד קיים. מועברת לטופס הגשה.');
        expect(mockNavigate).toHaveBeenCalledWith('/public-upload');
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('handles authentication error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'wrong@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'wrongpassword' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });

    test('handles missing user data', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('לא התקבל מידע משתמש לאחר ההתחברות.');
      });
    });

    test('handles role check error gracefully', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: { id: 'user123', email: 'test@test.com' } },
        error: null,
      });
      mockRpcGetMyRole.mockResolvedValue({
        data: null,
        error: { message: 'Role check failed' },
      });
      mockFromSelect.mockReturnValue({
        eq: () => ({
          single: () => Promise.resolve({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.warning).toHaveBeenCalledWith('לא ניתן היה לאמת את תפקיד המשתמש. מנסה המשך התחברות...');
      });
    });

    test('handles network errors', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('Form Validation Tests', () => {
    test('requires email field', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('אימייל');
      expect(emailInput).toHaveAttribute('required');
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    test('requires password field', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText('סיסמה');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('updates form state correctly', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('אימייל') as HTMLInputElement;
      const passwordInput = screen.getByLabelText('סיסמה') as HTMLInputElement;

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(emailInput.value).toBe('test@example.com');
      expect(passwordInput.value).toBe('password123');
    });
  });

  describe('Loading States Tests', () => {
    test('shows loading state during login', async () => {
      // Mock a delayed response
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: { user: { id: 'user123', email: 'test@test.com' } },
            error: null,
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      // Should show loading state
      expect(screen.getByText('מתחברות...')).toBeInTheDocument();
      
      // Button should be disabled
      expect(screen.getByRole('button', { name: /מתחברות/ })).toBeDisabled();
    });

    test('clears loading state after completion', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' },
      });

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'התחברות' })).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty form submission', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const form = screen.getByRole('button', { name: 'התחברות' }).closest('form');
      
      // HTML5 validation should prevent submission
      expect(() => {
        if (form) fireEvent.submit(form);
      }).not.toThrow();
    });

    test('handles tab switching during loading', async () => {
      mockSignInWithPassword.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: { user: { id: 'user123', email: 'test@test.com' } },
            error: null,
          }), 100)
        )
      );

      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      fireEvent.change(screen.getByLabelText('אימייל'), {
        target: { value: 'test@test.com' }
      });
      fireEvent.change(screen.getByLabelText('סיסמה'), {
        target: { value: 'password123' }
      });

      fireEvent.click(screen.getByRole('button', { name: 'התחברות' }));

      // Try to switch tabs during loading
      fireEvent.click(screen.getByText('הגשה למסעדה קיימת'));

      // Should still handle tab switch
      expect(screen.getByText('לחץ/י כאן למעבר לטופס')).toBeInTheDocument();
    });

    test('renders with proper RTL direction', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const container = screen.getByText('Food Vision').closest('div');
      expect(container?.closest('div')).toHaveAttribute('dir', 'rtl');
    });
  });

  describe('Accessibility Tests', () => {
    test('form inputs have proper labels', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      expect(screen.getByLabelText('אימייל')).toBeInTheDocument();
      expect(screen.getByLabelText('סיסמה')).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const loginTab = screen.getByText('התחברות');
      const submissionTab = screen.getByText('הגשה למסעדה קיימת');

      expect(loginTab).toHaveAttribute('type', 'button');
      expect(submissionTab).toHaveAttribute('type', 'button');
    });

    test('form has proper focus management', () => {
      render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText('אימייל');
      emailInput.focus();
      
      expect(document.activeElement).toBe(emailInput);
    });
  });
}); 