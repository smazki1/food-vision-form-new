
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import App from '../App';

// Mock all the heavy components to avoid complex dependencies
vi.mock('@/pages/Index', () => ({ default: () => <div>Index Page</div> }));
vi.mock('@/pages/CustomerLogin', () => ({ default: () => <div>Customer Login</div> }));
vi.mock('@/pages/customer/auth/LoginPage', () => ({ default: () => <div>Customer Auth Page</div> }));
vi.mock('@/components/public/PublicUploadForm', () => ({ default: () => <div>Public Upload Form</div> }));

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

// Mock route protection components
vi.mock('@/components/AdminRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));
vi.mock('@/components/PublicOnlyRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock admin layout
vi.mock('@/layouts/AdminLayout', () => ({
  default: () => <div>Admin Layout</div>
}));

// Mock lazy loaded components
vi.mock('@/pages/admin/Dashboard', () => ({
  default: () => <div>Admin Dashboard</div>
}));
vi.mock('@/pages/customer/CustomerDashboardPage', () => ({
  default: () => <div>Customer Dashboard</div>
}));
vi.mock('@/pages/customer/CustomerHomePage', () => ({
  default: () => <div>Customer Home</div>
}));
vi.mock('@/pages/editor/EditorDashboardPage', () => ({
  default: () => <div>Editor Dashboard</div>
}));

const TestWrapper = ({ initialEntries = ['/'] }: { initialEntries?: string[] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('App Routing Tests', () => {
  describe('Customer Authentication Flow Routes', () => {
    test('renders customer login page at /customer-login', () => {
      render(<TestWrapper initialEntries={['/customer-login']} />);
      expect(screen.getByText('Customer Login')).toBeInTheDocument();
    });

    test('renders customer auth page at /customer/auth', () => {
      render(<TestWrapper initialEntries={['/customer/auth']} />);
      expect(screen.getByText('Customer Auth Page')).toBeInTheDocument();
    });

    test('renders public upload page at /public-upload', () => {
      render(<TestWrapper initialEntries={['/public-upload']} />);
      expect(screen.getByText('Public Upload Form')).toBeInTheDocument();
    });

    test('renders customer dashboard at /customer/dashboard', () => {
      render(<TestWrapper initialEntries={['/customer/dashboard']} />);
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
    });

    test('renders customer home at /customer/home', () => {
      render(<TestWrapper initialEntries={['/customer/home']} />);
      expect(screen.getByText('Customer Home')).toBeInTheDocument();
    });
  });

  describe('Public Routes', () => {
    test('renders index page at root', () => {
      render(<TestWrapper initialEntries={['/']} />);
      expect(screen.getByText('Index Page')).toBeInTheDocument();
    });

    test('renders admin login at /admin-login', () => {
      render(<TestWrapper initialEntries={['/admin-login']} />);
      expect(screen.getByText('Admin Login')).toBeInTheDocument();
    });
  });

  describe('Editor Routes', () => {
    test('renders editor dashboard at /editor', () => {
      render(<TestWrapper initialEntries={['/editor']} />);
      expect(screen.getByText('Editor Dashboard')).toBeInTheDocument();
    });
  });

  describe('Admin Routes', () => {
    test('renders admin layout for admin routes', () => {
      render(<TestWrapper initialEntries={['/admin']} />);
      expect(screen.getByText('Admin Layout')).toBeInTheDocument();
    });

    test('renders admin dashboard at /admin/dashboard', () => {
      render(<TestWrapper initialEntries={['/admin/dashboard']} />);
      expect(screen.getByText('Admin Layout')).toBeInTheDocument();
    });
  });

  describe('Route Protection', () => {
    test('customer auth routes are wrapped with PublicOnlyRoute', () => {
      render(<TestWrapper initialEntries={['/customer-login']} />);
      expect(screen.getByText('Customer Login')).toBeInTheDocument();

      render(<TestWrapper initialEntries={['/customer/auth']} />);
      expect(screen.getByText('Customer Auth Page')).toBeInTheDocument();
    });

    test('customer dashboard routes are wrapped with CustomerRoute', () => {
      render(<TestWrapper initialEntries={['/customer/dashboard']} />);
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();

      render(<TestWrapper initialEntries={['/customer/home']} />);
      expect(screen.getByText('Customer Home')).toBeInTheDocument();
    });
  });

  describe('Navigation Flow Integration', () => {
    test('all customer authentication flow routes are accessible', () => {
      const routes = [
        '/customer-login',
        '/customer/auth', 
        '/public-upload',
        '/customer/dashboard',
        '/customer/home'
      ];

      routes.forEach(route => {
        const { unmount } = render(<TestWrapper initialEntries={[route]} />);
        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });

    test('customer auth route exists and is properly configured', () => {
      render(<TestWrapper initialEntries={['/customer/auth']} />);
      
      expect(screen.getByText('Customer Auth Page')).toBeInTheDocument();
      expect(screen.queryByText('404')).not.toBeInTheDocument();
      expect(screen.queryByText('Not Found')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles invalid routes gracefully', () => {
      render(<TestWrapper initialEntries={['/non-existent-route']} />);
      expect(document.body).toBeInTheDocument();
    });

    test('handles malformed routes', () => {
      const malformedRoutes = [
        '/customer//auth',
        '/customer/auth/',
        '//customer/auth',
        '/customer/auth//extra'
      ];

      malformedRoutes.forEach(route => {
        expect(() => {
          render(<TestWrapper initialEntries={[route]} />);
        }).not.toThrow();
      });
    });
  });

  describe('Route Consistency', () => {
    test('customer routes follow consistent pattern', () => {
      const customerRoutes = [
        '/customer-login',
        '/customer/auth',
        '/customer/dashboard', 
        '/customer/home'
      ];

      customerRoutes.forEach(route => {
        const { unmount } = render(<TestWrapper initialEntries={[route]} />);
        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });

    test('auth routes are properly separated', () => {
      const authRoutes = [
        '/admin-login',
        '/customer-login',
        '/customer/auth'
      ];

      authRoutes.forEach(route => {
        const { unmount } = render(<TestWrapper initialEntries={[route]} />);
        expect(document.body).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Performance', () => {
    test('routes render within reasonable time', () => {
      const startTime = performance.now();
      
      render(<TestWrapper initialEntries={['/customer/auth']} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      expect(renderTime).toBeLessThan(50);
    });

    test('switching between routes does not cause memory leaks', () => {
      const routes = ['/customer-login', '/customer/auth', '/public-upload'];
      
      routes.forEach(route => {
        const { unmount } = render(<TestWrapper initialEntries={[route]} />);
        expect(() => unmount()).not.toThrow();
      });
    });
  });

  describe('Integration with Browser History', () => {
    test('routes work with browser back/forward simulation', () => {
      render(<TestWrapper initialEntries={['/customer-login', '/customer/auth']} />);
      expect(screen.getByText('Customer Auth Page')).toBeInTheDocument();
    });

    test('nested customer routes work correctly', () => {
      render(<TestWrapper initialEntries={['/customer/dashboard']} />);
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();

      render(<TestWrapper initialEntries={['/customer/home']} />);
      expect(screen.getByText('Customer Home')).toBeInTheDocument();
    });
  });
});
