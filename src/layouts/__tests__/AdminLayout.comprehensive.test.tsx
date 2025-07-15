import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import AdminLayout from '../AdminLayout';
import { CurrentUserRoleState, CurrentUserRoleStatus } from '@/hooks/useCurrentUserRole';

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
    auth: {
      signOut: vi.fn(),
    },
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock useCurrentUserRole hook
vi.mock('@/hooks/useCurrentUserRole', () => ({
  useCurrentUserRole: vi.fn(),
}));

// Mock components
vi.mock('@/components/admin/notifications/NotificationCenter', () => ({
  NotificationCenter: ({ children }: any) => (
    <div data-testid="notification-center">{children}</div>
  ),
}));

vi.mock('@/components/admin/AdminSidebar', () => ({
  default: ({ onLogout }: any) => (
    <div data-testid="admin-sidebar">
      <button onClick={onLogout} data-testid="sidebar-logout-button">
        Logout
      </button>
    </div>
  ),
}));

vi.mock('@/components/admin/AdminMobileNav', () => ({
  default: ({ onLogout }: any) => (
    <div data-testid="admin-mobile-nav">
      <button onClick={onLogout} data-testid="mobile-logout-button">
        Logout
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/mobile-loading', () => ({
  MobileLoading: () => <div data-testid="mobile-loading">Loading...</div>,
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('AdminLayout Component', () => {
  let mockSignOut: any;
  let mockUseCurrentUserRole: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSignOut = vi.fn().mockResolvedValue({ error: null });
    
    // Get the mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    const { useCurrentUserRole } = await import('@/hooks/useCurrentUserRole');
    
    mockUseCurrentUserRole = useCurrentUserRole as any;
    
    // Default mock for Supabase
    (supabase.auth.signOut as any).mockImplementation(mockSignOut);
    
    // Default mock for useCurrentUserRole
    mockUseCurrentUserRole.mockReturnValue({
      status: 'authenticated' as CurrentUserRoleStatus,
      isAdmin: true,
      isAccountManager: false,
      role: 'admin',
      error: null,
      userId: 'test-user-id',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <MemoryRouter>
        {component}
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    it('renders admin layout with all essential components', () => {
      renderWithRouter(<AdminLayout />);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('admin-mobile-nav')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('renders with proper layout structure', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      // Check main layout structure
      const mainLayout = container.querySelector('.flex.h-screen.bg-gray-100');
      expect(mainLayout).toBeInTheDocument();

      // Check sidebar visibility classes
      const sidebarContainer = container.querySelector('.hidden.md\\:flex');
      expect(sidebarContainer).toBeInTheDocument();

      // Check mobile nav visibility classes
      const mobileNavContainer = container.querySelector('.md\\:hidden');
      expect(mobileNavContainer).toBeInTheDocument();
    });

    it('renders main content area with proper styling', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('flex-1', 'overflow-x-hidden', 'overflow-y-auto');
    });
  });

  describe('Authentication State Management', () => {
    it('handles authenticated admin user correctly', () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'authenticated' as CurrentUserRoleStatus,
        isAdmin: true,
        isAccountManager: false,
        role: 'admin',
        error: null,
        userId: 'admin-user-id',
      });

      renderWithRouter(<AdminLayout />);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('handles account manager user correctly', () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'authenticated' as CurrentUserRoleStatus,
        isAdmin: false,
        isAccountManager: true,
        role: 'account_manager',
        error: null,
        userId: 'manager-user-id',
      });

      renderWithRouter(<AdminLayout />);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('handles authentication error state', () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'error' as CurrentUserRoleStatus,
        isAdmin: false,
        isAccountManager: false,
        role: null,
        error: 'Authentication failed',
        userId: null,
      });

      renderWithRouter(<AdminLayout />);

      // Layout should still render as AdminRoute handles gating
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    it('handles loading state', () => {
      mockUseCurrentUserRole.mockReturnValue({
        status: 'loading' as CurrentUserRoleStatus,
        isAdmin: false,
        isAccountManager: false,
        role: null,
        error: null,
        userId: null,
      });

      renderWithRouter(<AdminLayout />);

      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('handles successful logout from sidebar', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
      expect(toast.info).toHaveBeenCalledWith('התנתקת בהצלחה');
    });

    it('handles successful logout from mobile nav', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('mobile-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
      expect(toast.info).toHaveBeenCalledWith('התנתקת בהצלחה');
    });

    it('handles logout error with proper error message', async () => {
      const errorMessage = 'Network error';
      mockSignOut.mockResolvedValue({ error: { message: errorMessage } });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });

      expect(toast.error).toHaveBeenCalledWith(`Logout failed: ${errorMessage}`);
      expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
    });

    it('clears localStorage on logout', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      // Mock localStorage
      const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem');

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });

      expect(mockRemoveItem).toHaveBeenCalledWith('adminAuthenticated');
      expect(mockRemoveItem).toHaveBeenCalledWith('adminAuthTime');
    });
  });

  describe('Responsive Design', () => {
    it('shows desktop sidebar and hides mobile nav on desktop', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      // Desktop sidebar should be visible
      const desktopSidebar = container.querySelector('.hidden.md\\:flex');
      expect(desktopSidebar).toBeInTheDocument();

      // Mobile nav should be hidden on desktop
      const mobileNav = container.querySelector('.md\\:hidden');
      expect(mobileNav).toBeInTheDocument();
    });

    it('applies correct responsive classes to main content', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('flex-1', 'overflow-x-hidden', 'overflow-y-auto');

      const contentContainer = container.querySelector('.max-w-full');
      expect(contentContainer).toBeInTheDocument();
    });

    it('applies correct padding classes for responsive design', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('p-2', 'sm:p-3', 'md:p-6');
    });
  });

  describe('Error Handling', () => {
    it('handles console logging for auth state', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter(<AdminLayout />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AdminLayout] Current auth state'),
        expect.any(Object)
      );

      consoleSpy.mockRestore();
    });

    it('handles console logging for rendering', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter(<AdminLayout />);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AdminLayout] Rendering admin layout')
      );

      consoleSpy.mockRestore();
    });

    it('handles logout with console logging', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockSignOut.mockResolvedValue({ error: null });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[AdminLayout] handleLogout called');
      });

      consoleSpy.mockRestore();
    });

    it('handles logout error with console logging', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = { message: 'Network error' };
      mockSignOut.mockResolvedValue({ error });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('[AdminLayout] Logout error:', error);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Component Integration', () => {
    it('passes logout handler to AdminSidebar correctly', () => {
      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      expect(logoutButton).toBeInTheDocument();

      // Test that clicking triggers the logout process
      fireEvent.click(logoutButton);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('passes logout handler to AdminMobileNav correctly', () => {
      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('mobile-logout-button');
      expect(logoutButton).toBeInTheDocument();

      // Test that clicking triggers the logout process
      fireEvent.click(logoutButton);
      expect(mockSignOut).toHaveBeenCalled();
    });

    it('renders Outlet component for nested routes', () => {
      renderWithRouter(<AdminLayout />);

      const outlet = screen.getByTestId('outlet');
      expect(outlet).toBeInTheDocument();
      expect(outlet).toHaveTextContent('Outlet Content');
    });
  });

  describe('Theme Support', () => {
    it('applies correct theme classes to layout', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      const mainLayout = container.querySelector('.flex.h-screen');
      expect(mainLayout).toHaveClass('bg-gray-100', 'dark:bg-gray-900');

      const mainContent = container.querySelector('main');
      expect(mainContent).toHaveClass('bg-gray-100', 'dark:bg-gray-900');
    });

    it('maintains theme consistency across components', () => {
      const { container } = renderWithRouter(<AdminLayout />);

      // Check that theme classes are applied consistently
      const themeElements = container.querySelectorAll('.bg-gray-100.dark\\:bg-gray-900');
      expect(themeElements.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Integration', () => {
    it('uses navigate hook correctly', () => {
      renderWithRouter(<AdminLayout />);

      expect(mockNavigate).toBeDefined();
    });

    it('navigates to admin login on logout', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
      });
    });

    it('navigates to admin login even on logout error', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Error' } });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin-login');
      });
    });
  });

  describe('Hebrew Language Support', () => {
    it('displays Hebrew success message on successful logout', async () => {
      mockSignOut.mockResolvedValue({ error: null });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(toast.info).toHaveBeenCalledWith('התנתקת בהצלחה');
      });
    });

    it('handles Hebrew text in error messages', async () => {
      const errorMessage = 'שגיאה בהתנתקות';
      mockSignOut.mockResolvedValue({ error: { message: errorMessage } });

      renderWithRouter(<AdminLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(`Logout failed: ${errorMessage}`);
      });
    });
  });
}); 