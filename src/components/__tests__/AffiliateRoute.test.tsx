import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AffiliateRoute from '../AffiliateRoute';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Test wrapper
const createTestWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

// Test child component
const TestChildComponent = () => <div data-testid="protected-content">Protected Content</div>;

describe('AffiliateRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Happy Path - Valid Session', () => {
    it('should render children when valid affiliate session exists', async () => {
      // Set up valid localStorage session
      const validSession = {
        affiliate_id: 'test-affiliate-id',
        email: 'test@affiliate.com',
        name: 'Test Affiliate'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });

      // Should not redirect
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should handle session with minimal required fields', async () => {
      const minimalSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(minimalSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should handle session with additional fields', async () => {
      const extendedSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com',
        name: 'Test Name',
        phone: '+1234567890',
        extraField: 'should be ignored'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(extendedSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases - Invalid Sessions', () => {
    it('should redirect when no localStorage session exists', async () => {
      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });

      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should redirect when localStorage session is empty string', async () => {
      localStorage.setItem('affiliate_session', '');

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });

    it('should redirect when session is missing affiliate_id', async () => {
      const invalidSession = {
        email: 'test@test.com',
        name: 'Test Name'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(invalidSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });

    it('should redirect when session is missing email', async () => {
      const invalidSession = {
        affiliate_id: 'test-id',
        name: 'Test Name'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(invalidSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });

    it('should redirect when affiliate_id is null or empty', async () => {
      const invalidSession = {
        affiliate_id: null,
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(invalidSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });

    it('should redirect when email is null or empty', async () => {
      const invalidSession = {
        affiliate_id: 'test-id',
        email: ''
      };
      localStorage.setItem('affiliate_session', JSON.stringify(invalidSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON in localStorage', async () => {
      localStorage.setItem('affiliate_session', 'invalid-json{');

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });

    it('should handle localStorage access errors', async () => {
      // Mock localStorage.getItem to throw error
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('localStorage not available');
      });

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });

      // Restore localStorage
      localStorage.getItem = originalGetItem;
    });

    it('should handle JSON.parse throwing error', async () => {
      // Mock JSON.parse to throw error
      const originalParse = JSON.parse;
      JSON.parse = vi.fn(() => {
        throw new Error('JSON parse error');
      });

      localStorage.setItem('affiliate_session', '{"valid": "json"}');

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });

      // Restore JSON.parse
      JSON.parse = originalParse;
    });

    it('should handle navigation errors gracefully', async () => {
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      // Should not crash even if navigation fails
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('בודק הרשאות שותף...')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('should show unauthorized message when not authorized', async () => {
      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      // Wait for loading to complete and redirect to happen
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/customer/auth', { replace: true });
      });
    });
  });

  describe('Component Integration', () => {
    it('should pass through all children when authorized', async () => {
      const validSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <TestChildComponent />
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('child-1')).toBeInTheDocument();
        expect(screen.getByTestId('child-2')).toBeInTheDocument();
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should handle React fragments as children', async () => {
      const validSession = {
        affiliate_id: 'test-id',
        email: 'test@test.com'
      };
      localStorage.setItem('affiliate_session', JSON.stringify(validSession));

      const Wrapper = createTestWrapper();
      render(
        <AffiliateRoute>
          <>
            <div data-testid="fragment-child-1">Fragment Child 1</div>
            <div data-testid="fragment-child-2">Fragment Child 2</div>
          </>
        </AffiliateRoute>,
        { wrapper: Wrapper }
      );

      await waitFor(() => {
        expect(screen.getByTestId('fragment-child-1')).toBeInTheDocument();
        expect(screen.getByTestId('fragment-child-2')).toBeInTheDocument();
      });
    });
  });
}); 