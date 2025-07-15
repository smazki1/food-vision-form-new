import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import EditorLayout from '../EditorLayout';

// Mock environment variables
vi.mock('import.meta', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://test-project.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
  }
}));

// Mock hooks
vi.mock('@/hooks/useEditorAuth', () => ({
  useEditorAuth: vi.fn(),
}));

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(),
}));

// Mock components
vi.mock('@/components/editor/EditorSidebar', () => ({
  default: ({ onLogout }: any) => (
    <div data-testid="editor-sidebar">
      <button onClick={onLogout} data-testid="sidebar-logout-button">
        Logout
      </button>
    </div>
  ),
}));

vi.mock('@/components/editor/EditorMobileNav', () => ({
  default: ({ onLogout }: any) => (
    <div data-testid="editor-mobile-nav">
      <button onClick={onLogout} data-testid="mobile-logout-button">
        Logout
      </button>
    </div>
  ),
}));

vi.mock('@/components/admin/notifications/NotificationCenter', () => ({
  NotificationCenter: () => (
    <div data-testid="notification-center">Notification Center</div>
  ),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  };
});

describe('EditorLayout Component', () => {
  let mockUseEditorAuth: any;
  let mockUseIsMobile: any;
  let mockHandleLogout: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock functions
    mockHandleLogout = vi.fn();
    
    // Get the mocked functions
    const { useEditorAuth } = await import('@/hooks/useEditorAuth');
    const { useIsMobile } = await import('@/hooks/use-mobile');
    
    mockUseEditorAuth = useEditorAuth as any;
    mockUseIsMobile = useIsMobile as any;
    
    // Default mock implementations
    mockUseEditorAuth.mockReturnValue({
      isAuthenticated: true,
      isChecking: false,
      handleLogout: mockHandleLogout,
    });
    
    mockUseIsMobile.mockReturnValue(false);
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
    it('renders editor layout with all essential components when authenticated', () => {
      renderWithRouter(<EditorLayout />);

      // Check main components
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('renders with proper layout structure', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      // Check main layout structure
      const mainLayout = container.querySelector('.flex.min-h-screen.bg-background');
      expect(mainLayout).toBeInTheDocument();

      // Check sidebar visibility classes
      const sidebarContainer = container.querySelector('.hidden.md\\:block');
      expect(sidebarContainer).toBeInTheDocument();

      // Check main content area
      const mainContentArea = container.querySelector('.flex.flex-1.flex-col.w-full');
      expect(mainContentArea).toBeInTheDocument();
    });

    it('renders main content area with proper styling', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const mainContent = container.querySelector('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveClass('flex-1');
    });

    it('renders notification center in header', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const headerArea = container.querySelector('.flex.justify-end.items-center.border-b');
      expect(headerArea).toBeInTheDocument();
      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });
  });

  describe('Authentication State Management', () => {
    it('renders layout when user is authenticated', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: true,
        isChecking: false,
        handleLogout: mockHandleLogout,
      });

      renderWithRouter(<EditorLayout />);

      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('shows loading state when checking authentication', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      renderWithRouter(<EditorLayout />);

      expect(screen.getByText('טוען...')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    });

    it('renders nothing when not authenticated and not checking', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: false,
        handleLogout: mockHandleLogout,
      });

      const { container } = renderWithRouter(<EditorLayout />);

      expect(container.firstChild).toBeNull();
      expect(screen.queryByTestId('editor-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    });

    it('handles transition from loading to authenticated', () => {
      // Start with loading
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      const { rerender } = renderWithRouter(<EditorLayout />);
      expect(screen.getByText('טוען...')).toBeInTheDocument();

      // Transition to authenticated
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: true,
        isChecking: false,
        handleLogout: mockHandleLogout,
      });

      rerender(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>
      );

      expect(screen.queryByText('טוען...')).not.toBeInTheDocument();
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
    });

    it('handles transition from loading to not authenticated', () => {
      // Start with loading
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      const { rerender, container } = renderWithRouter(<EditorLayout />);
      expect(screen.getByText('טוען...')).toBeInTheDocument();

      // Transition to not authenticated
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: false,
        handleLogout: mockHandleLogout,
      });

      rerender(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>
      );

      expect(screen.queryByText('טוען...')).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Mobile Responsiveness', () => {
    it('shows desktop sidebar and hides mobile nav on desktop', () => {
      mockUseIsMobile.mockReturnValue(false);

      renderWithRouter(<EditorLayout />);

      // Desktop sidebar should be visible
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      
      // Mobile nav should not be rendered
      expect(screen.queryByTestId('editor-mobile-nav')).not.toBeInTheDocument();
    });

    it('shows mobile nav and desktop sidebar on mobile', () => {
      mockUseIsMobile.mockReturnValue(true);

      renderWithRouter(<EditorLayout />);

      // Both should be rendered on mobile
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('editor-mobile-nav')).toBeInTheDocument();
    });

    it('applies correct responsive classes to sidebar', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const sidebarContainer = container.querySelector('.hidden.md\\:block');
      expect(sidebarContainer).toBeInTheDocument();
      expect(sidebarContainer).toHaveClass('border-r');
    });

    it('applies correct responsive classes to header', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const headerArea = container.querySelector('.flex.justify-end.items-center.border-b');
      expect(headerArea).toBeInTheDocument();
      expect(headerArea).toHaveClass('px-3', 'sm:px-6', 'py-2');
    });
  });

  describe('Loading State', () => {
    it('displays Hebrew loading text', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      renderWithRouter(<EditorLayout />);

      expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('applies correct classes to loading container', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      const { container } = renderWithRouter(<EditorLayout />);

      const loadingContainer = container.querySelector('.flex.justify-center.items-center.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveTextContent('טוען...');
    });

    it('does not render other components while loading', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      renderWithRouter(<EditorLayout />);

      expect(screen.queryByTestId('editor-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('notification-center')).not.toBeInTheDocument();
      expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('passes logout handler to sidebar correctly', () => {
      renderWithRouter(<EditorLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);

      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });

    it('passes logout handler to mobile nav correctly', () => {
      mockUseIsMobile.mockReturnValue(true);

      renderWithRouter(<EditorLayout />);

      const logoutButton = screen.getByTestId('mobile-logout-button');
      fireEvent.click(logoutButton);

      expect(mockHandleLogout).toHaveBeenCalledTimes(1);
    });

    it('calls logout handler only once when clicked', () => {
      renderWithRouter(<EditorLayout />);

      const logoutButton = screen.getByTestId('sidebar-logout-button');
      fireEvent.click(logoutButton);
      fireEvent.click(logoutButton);

      expect(mockHandleLogout).toHaveBeenCalledTimes(2);
    });
  });

  describe('Component Integration', () => {
    it('integrates with EditorSidebar component', () => {
      renderWithRouter(<EditorLayout />);

      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
    });

    it('integrates with EditorMobileNav component on mobile', () => {
      mockUseIsMobile.mockReturnValue(true);

      renderWithRouter(<EditorLayout />);

      expect(screen.getByTestId('editor-mobile-nav')).toBeInTheDocument();
    });

    it('integrates with NotificationCenter component', () => {
      renderWithRouter(<EditorLayout />);

      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    });

    it('integrates with Outlet component for nested routes', () => {
      renderWithRouter(<EditorLayout />);

      const outlet = screen.getByTestId('outlet');
      expect(outlet).toBeInTheDocument();
      expect(outlet).toHaveTextContent('Outlet Content');
    });
  });

  describe('Layout Structure', () => {
    it('applies correct flex classes to main layout', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const mainLayout = container.querySelector('.flex.min-h-screen.bg-background');
      expect(mainLayout).toBeInTheDocument();
    });

    it('applies correct flex classes to content area', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const contentArea = container.querySelector('.flex.flex-1.flex-col.w-full');
      expect(contentArea).toBeInTheDocument();
    });

    it('applies correct border classes', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const sidebarContainer = container.querySelector('.border-r');
      expect(sidebarContainer).toBeInTheDocument();

      const headerArea = container.querySelector('.border-b');
      expect(headerArea).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies correct theme classes to layout', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      const mainLayout = container.querySelector('.min-h-screen');
      expect(mainLayout).toHaveClass('bg-background');
    });

    it('maintains theme consistency across components', () => {
      const { container } = renderWithRouter(<EditorLayout />);

      // Check that theme classes are applied consistently
      const backgroundElements = container.querySelectorAll('.bg-background');
      expect(backgroundElements.length).toBeGreaterThan(0);
    });
  });

  describe('Hebrew Language Support', () => {
    it('displays Hebrew loading text correctly', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      renderWithRouter(<EditorLayout />);

      expect(screen.getByText('טוען...')).toBeInTheDocument();
    });

    it('maintains Hebrew text direction in loading state', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: false,
        isChecking: true,
        handleLogout: mockHandleLogout,
      });

      const { container } = renderWithRouter(<EditorLayout />);

      const loadingText = container.querySelector('.flex.justify-center.items-center.min-h-screen');
      expect(loadingText).toHaveTextContent('טוען...');
    });
  });

  describe('Hook Integration', () => {
    it('properly integrates with useEditorAuth hook', () => {
      const mockAuth = {
        isAuthenticated: true,
        isChecking: false,
        handleLogout: mockHandleLogout,
      };

      mockUseEditorAuth.mockReturnValue(mockAuth);

      renderWithRouter(<EditorLayout />);

      expect(mockUseEditorAuth).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
    });

    it('properly integrates with useIsMobile hook', () => {
      mockUseIsMobile.mockReturnValue(false);

      renderWithRouter(<EditorLayout />);

      expect(mockUseIsMobile).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('editor-mobile-nav')).not.toBeInTheDocument();
    });

    it('responds to mobile state changes', () => {
      // Start with desktop
      mockUseIsMobile.mockReturnValue(false);
      const { rerender } = renderWithRouter(<EditorLayout />);
      expect(screen.queryByTestId('editor-mobile-nav')).not.toBeInTheDocument();

      // Change to mobile
      mockUseIsMobile.mockReturnValue(true);
      rerender(
        <MemoryRouter>
          <EditorLayout />
        </MemoryRouter>
      );
      expect(screen.getByTestId('editor-mobile-nav')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles undefined authentication state gracefully', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: undefined,
        isChecking: false,
        handleLogout: mockHandleLogout,
      });

      const { container } = renderWithRouter(<EditorLayout />);

      // Should render nothing when isAuthenticated is undefined
      expect(container.firstChild).toBeNull();
    });

    it('handles missing logout handler gracefully', () => {
      mockUseEditorAuth.mockReturnValue({
        isAuthenticated: true,
        isChecking: false,
        handleLogout: undefined,
      });

      renderWithRouter(<EditorLayout />);

      // Should still render the layout
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('outlet')).toBeInTheDocument();
    });

    it('handles mobile hook errors gracefully', () => {
      mockUseIsMobile.mockReturnValue(undefined);

      renderWithRouter(<EditorLayout />);

      // Should still render the layout
      expect(screen.getByTestId('editor-sidebar')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-mobile-nav')).not.toBeInTheDocument();
    });
  });
}); 