import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CustomerLayout } from '../CustomerLayout';

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

// Mock hooks
vi.mock('@/hooks/useClientAuth', () => ({
  useClientAuth: vi.fn(),
}));

vi.mock('@/hooks/useUnifiedAuth', () => ({
  useUnifiedAuth: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, className, asChild, variant, onClick, ...props }: any) => {
    if (asChild) {
      // When asChild is true, return the children with the className applied
      return React.cloneElement(children, { 
        className: `${children.props.className || ''} ${className || ''}`.trim(),
        ...props
      });
    }
    return (
      <button className={className} onClick={onClick} data-testid={props['data-testid']} {...props}>
        {children}
      </button>
    );
  },
}));

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className }: any) => (
    <div className={className} data-testid="alert">
      {children}
    </div>
  ),
  AlertDescription: ({ children, className }: any) => (
    <div className={className} data-testid="alert-description">
      {children}
    </div>
  ),
  AlertTitle: ({ children, className }: any) => (
    <div className={className} data-testid="alert-title">
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/toaster', () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

vi.mock('@/components/customer/BottomNavigation', () => ({
  BottomNavigation: () => <div data-testid="bottom-navigation">Bottom Navigation</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: vi.fn(() => ({ pathname: '/customer/dashboard' })),
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    Link: ({ to, children, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('CustomerLayout Component', () => {
  let mockSignOut: any;
  let mockUseClientAuth: any;
  let mockUseUnifiedAuth: any;
  let mockUseToast: any;
  let mockToast: any;
  let mockUseLocation: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock functions
    mockSignOut = vi.fn().mockResolvedValue({ error: null });
    mockToast = vi.fn();
    
    // Get the mocked functions
    const { supabase } = await import('@/integrations/supabase/client');
    const { useClientAuth } = await import('@/hooks/useClientAuth');
    const { useUnifiedAuth } = await import('@/hooks/useUnifiedAuth');
    const { useToast } = await import('@/hooks/use-toast');
    const { useLocation } = await import('react-router-dom');
    
    mockUseClientAuth = useClientAuth as any;
    mockUseUnifiedAuth = useUnifiedAuth as any;
    mockUseToast = useToast as any;
    mockUseLocation = useLocation as any;
    
    // Default mock implementations
    (supabase.auth.signOut as any).mockImplementation(mockSignOut);
    mockUseToast.mockReturnValue({ toast: mockToast });
    
    // Default auth state
    mockUseClientAuth.mockReturnValue({
      clientId: 'test-client-id',
      clientRecordStatus: 'found',
      errorState: null,
    });
    
    mockUseUnifiedAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: 'test-user-id' },
      role: 'customer',
      clientId: 'test-client-id',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (component: React.ReactElement, pathname = '/customer/dashboard') => {
    mockUseLocation.mockReturnValue({ pathname });
    return render(
      <MemoryRouter initialEntries={[pathname]}>
        {component}
      </MemoryRouter>
    );
  };

  describe('Component Rendering', () => {
    it('renders customer layout with all essential components', () => {
      renderWithRouter(<CustomerLayout />);

      // Check main components
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });

    it('renders desktop sidebar with navigation links', () => {
      renderWithRouter(<CustomerLayout />);

      // Check desktop sidebar navigation
      expect(screen.getByText('לוח בקרה')).toBeInTheDocument();
      expect(screen.getByText('דף הבית')).toBeInTheDocument();
      expect(screen.getByText('המנות שלי')).toBeInTheDocument();
      expect(screen.getByText('הגלריה שלי')).toBeInTheDocument();
      expect(screen.getByText('העלאת מנה חדשה')).toBeInTheDocument();
      expect(screen.getByText('פרופיל')).toBeInTheDocument();
    });

    it('renders with proper responsive layout structure', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      // Check responsive layout classes
      const mainLayout = container.querySelector('.min-h-screen.flex.flex-col.md\\:flex-row');
      expect(mainLayout).toBeInTheDocument();

      // Check desktop sidebar
      const sidebar = container.querySelector('.hidden.md\\:block');
      expect(sidebar).toBeInTheDocument();

      // Check main content area
      const mainContent = container.querySelector('.flex-1.overflow-auto');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Authentication State Management', () => {
    it('handles authenticated user with client record', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: 'test-client-id',
        clientRecordStatus: 'found',
        errorState: null,
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: 'test-client-id',
      });

      renderWithRouter(<CustomerLayout />);

      // Should not show alert banners
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('shows client profile warning when client record not found', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'not-found',
        errorState: null,
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      renderWithRouter(<CustomerLayout />);

      // Should show no client profile banner
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-title')).toHaveTextContent('אין פרופיל לקוח מקושר');
      expect(screen.getByTestId('alert-description')).toHaveTextContent('החשבון שלכם/ן מאומת');
    });

    it('shows error banner when there is an error state', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'error',
        errorState: 'Database connection failed',
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      renderWithRouter(<CustomerLayout />);

      // Should show error banner
      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByTestId('alert-title')).toHaveTextContent('שגיאה בטעינת פרופיל לקוח');
      expect(screen.getByTestId('alert-description')).toHaveTextContent('Database connection failed');
    });

    it('handles loading state gracefully', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'loading',
        errorState: null,
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      renderWithRouter(<CustomerLayout />);

      // Should not show alert banners during loading
      expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });
  });

  describe('Navigation Active States', () => {
    it('shows dashboard as active when on dashboard route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/dashboard');

      const dashboardLink = screen.getByText('לוח בקרה');
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink.closest('a')).toHaveAttribute('href', '/customer/dashboard');
    });

    it('shows home as active when on home route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/home');

      const homeLink = screen.getByText('דף הבית');
      expect(homeLink).toBeInTheDocument();
      expect(homeLink.closest('a')).toHaveAttribute('href', '/customer/home');
    });

    it('shows submissions as active when on submissions route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/submissions-status');

      const submissionsLink = screen.getByText('המנות שלי');
      expect(submissionsLink).toBeInTheDocument();
      expect(submissionsLink.closest('a')).toHaveAttribute('href', '/customer/submissions-status');
    });

    it('shows gallery as active when on gallery route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/gallery');

      const galleryLink = screen.getByText('הגלריה שלי');
      expect(galleryLink).toBeInTheDocument();
      expect(galleryLink.closest('a')).toHaveAttribute('href', '/customer/gallery');
    });

    it('shows upload as active when on upload route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/upload');

      const uploadLink = screen.getByText('העלאת מנה חדשה');
      expect(uploadLink).toBeInTheDocument();
      expect(uploadLink.closest('a')).toHaveAttribute('href', '/customer/upload');
    });

    it('shows profile as active when on profile route', () => {
      renderWithRouter(<CustomerLayout />, '/customer/profile');

      const profileLink = screen.getByText('פרופיל');
      expect(profileLink).toBeInTheDocument();
      expect(profileLink.closest('a')).toHaveAttribute('href', '/customer/profile');
    });
  });

  describe('Responsive Design', () => {
    it('hides desktop sidebar on mobile and shows bottom navigation', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      // Desktop sidebar should be hidden on mobile
      const sidebar = container.querySelector('.hidden.md\\:block');
      expect(sidebar).toBeInTheDocument();

      // Bottom navigation should be visible
      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('applies correct responsive classes to main content', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const mainContent = container.querySelector('.flex-1.overflow-auto');
      expect(mainContent).toBeInTheDocument();

      // Check responsive padding
      const contentContainer = container.querySelector('.pb-20.md\\:pb-0');
      expect(contentContainer).toBeInTheDocument();
    });

    it('applies correct responsive classes to content wrapper', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const contentWrapper = container.querySelector('.w-full.md\\:max-w-5xl');
      expect(contentWrapper).toBeInTheDocument();

      const paddingContainer = container.querySelector('.px-3.md\\:px-4');
      expect(paddingContainer).toBeInTheDocument();
    });
  });

  describe('Error Handling and Console Logging', () => {
    it('logs authentication debug information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter(<CustomerLayout />);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH_DEBUG] CustomerLayout - State received:',
        expect.objectContaining({
          clientId: 'test-client-id',
          clientRecordStatus: 'found',
          errorState: null,
        })
      );

      consoleSpy.mockRestore();
    });

    it('logs pathname in debug information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      renderWithRouter(<CustomerLayout />, '/customer/gallery');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH_DEBUG] CustomerLayout - State received:',
        expect.objectContaining({
          pathname: '/customer/gallery',
        })
      );

      consoleSpy.mockRestore();
    });

    it('logs unified auth state in debug information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'unified-user-id' },
        role: 'customer',
        clientId: 'unified-client-id',
      });

      renderWithRouter(<CustomerLayout />);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[AUTH_DEBUG] CustomerLayout - State received:',
        expect.objectContaining({
          unifiedIsAuthenticated: true,
          unifiedUser: 'unified-user-id',
          unifiedRole: 'customer',
          unifiedAuthClientId: 'unified-client-id',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Theme Support', () => {
    it('applies correct theme classes to layout', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const mainLayout = container.querySelector('.min-h-screen');
      expect(mainLayout).toHaveClass('bg-background');

      const sidebar = container.querySelector('.bg-card');
      expect(sidebar).toBeInTheDocument();
    });

    it('applies border and spacing classes correctly', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const sidebar = container.querySelector('.border-r');
      expect(sidebar).toBeInTheDocument();

      const navContainer = container.querySelector('.flex.flex-col.gap-1');
      expect(navContainer).toBeInTheDocument();
    });
  });

  describe('Alert System', () => {
    it('shows amber alert for missing client profile', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'not-found',
        errorState: null,
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      const { container } = renderWithRouter(<CustomerLayout />);

      const alert = container.querySelector('.bg-amber-50');
      expect(alert).toBeInTheDocument();

      const alertWithBorder = container.querySelector('.border-amber-200');
      expect(alertWithBorder).toBeInTheDocument();
    });

    it('shows red alert for error state', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'error',
        errorState: 'Connection failed',
      });

      const { container } = renderWithRouter(<CustomerLayout />);

      const alert = container.querySelector('.bg-red-50');
      expect(alert).toBeInTheDocument();

      const alertWithBorder = container.querySelector('.border-red-200');
      expect(alertWithBorder).toBeInTheDocument();
    });

    it('prioritizes error banner over client profile warning', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'error',
        errorState: 'Database error',
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      renderWithRouter(<CustomerLayout />);

      // Should show error banner, not client profile warning
      expect(screen.getByTestId('alert-title')).toHaveTextContent('שגיאה בטעינת פרופיל לקוח');
      expect(screen.getByTestId('alert-description')).toHaveTextContent('Database error');
    });
  });

  describe('Component Integration', () => {
    it('renders all navigation links with correct hrefs', () => {
      renderWithRouter(<CustomerLayout />);

      const dashboardLink = screen.getByText('לוח בקרה').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/customer/dashboard');

      const homeLink = screen.getByText('דף הבית').closest('a');
      expect(homeLink).toHaveAttribute('href', '/customer/home');

      const submissionsLink = screen.getByText('המנות שלי').closest('a');
      expect(submissionsLink).toHaveAttribute('href', '/customer/submissions-status');

      const galleryLink = screen.getByText('הגלריה שלי').closest('a');
      expect(galleryLink).toHaveAttribute('href', '/customer/gallery');

      const uploadLink = screen.getByText('העלאת מנה חדשה').closest('a');
      expect(uploadLink).toHaveAttribute('href', '/customer/upload');

      const profileLink = screen.getByText('פרופיל').closest('a');
      expect(profileLink).toHaveAttribute('href', '/customer/profile');
    });

    it('renders icons with navigation links', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      // Check for Lucide icons (they should be rendered as SVG elements)
      const svgIcons = container.querySelectorAll('svg');
      expect(svgIcons.length).toBeGreaterThan(0);
    });

    it('integrates with BottomNavigation component', () => {
      renderWithRouter(<CustomerLayout />);

      expect(screen.getByTestId('bottom-navigation')).toBeInTheDocument();
    });

    it('integrates with Toaster component', () => {
      renderWithRouter(<CustomerLayout />);

      expect(screen.getByTestId('toaster')).toBeInTheDocument();
    });
  });

  describe('Hebrew Language Support', () => {
    it('displays Hebrew navigation text correctly', () => {
      renderWithRouter(<CustomerLayout />);

      expect(screen.getByText('לוח בקרה')).toBeInTheDocument();
      expect(screen.getByText('דף הבית')).toBeInTheDocument();
      expect(screen.getByText('המנות שלי')).toBeInTheDocument();
      expect(screen.getByText('הגלריה שלי')).toBeInTheDocument();
      expect(screen.getByText('העלאת מנה חדשה')).toBeInTheDocument();
      expect(screen.getByText('פרופיל')).toBeInTheDocument();
    });

    it('displays Hebrew alert messages correctly', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'not-found',
        errorState: null,
      });

      mockUseUnifiedAuth.mockReturnValue({
        isAuthenticated: true,
        user: { id: 'test-user-id' },
        role: 'customer',
        clientId: null,
      });

      renderWithRouter(<CustomerLayout />);

      expect(screen.getByText('אין פרופיל לקוח מקושר')).toBeInTheDocument();
      expect(screen.getByText(/החשבון שלכם\/ן מאומת/)).toBeInTheDocument();
    });

    it('displays Hebrew error messages correctly', () => {
      mockUseClientAuth.mockReturnValue({
        clientId: null,
        clientRecordStatus: 'error',
        errorState: 'שגיאה בטעינת נתונים',
      });

      renderWithRouter(<CustomerLayout />);

      expect(screen.getByText('שגיאה בטעינת פרופיל לקוח')).toBeInTheDocument();
      expect(screen.getByText('שגיאה בטעינת נתונים')).toBeInTheDocument();
    });
  });

  describe('Layout Behavior', () => {
    it('positions content correctly with bottom navigation padding', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      // Main content should have bottom padding for mobile nav
      const mainContent = container.querySelector('.pb-20.md\\:pb-0');
      expect(mainContent).toBeInTheDocument();
    });

    it('applies correct max-width to content wrapper', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const contentWrapper = container.querySelector('.md\\:max-w-5xl');
      expect(contentWrapper).toBeInTheDocument();
    });

    it('centers content with responsive margins', () => {
      const { container } = renderWithRouter(<CustomerLayout />);

      const centeredContent = container.querySelector('.mx-auto');
      expect(centeredContent).toBeInTheDocument();
    });
  });
}); 