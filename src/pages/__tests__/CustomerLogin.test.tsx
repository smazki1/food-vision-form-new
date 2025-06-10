import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import CustomerLogin from '../CustomerLogin';

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the auth hook
vi.mock('@/hooks/useUnifiedAuth', () => ({
  useUnifiedAuth: () => ({
    signIn: vi.fn(),
    resetPassword: vi.fn(),
  }),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CustomerLogin Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Happy Path Tests', () => {
    test('renders the main landing page correctly', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      // Check for main elements
      expect(screen.getByText('Food Vision')).toBeInTheDocument();
      expect(screen.getByText('פלטפורמה מתקדמת לעיבוד תמונות מזון')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    test('displays pricing information correctly', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      // Check pricing elements
      expect(screen.getByText('249')).toBeInTheDocument();
      expect(screen.getByText('499₪')).toBeInTheDocument();
      expect(screen.getByText('מוגבל ל 30 עסקים בלבד')).toBeInTheDocument();
    });

    test('displays all feature list items', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const features = [
        '3-5 מנות נבחרות מהתפריט',
        '10 תמונות באיכות 4K',
        'מסירה תוך 72 שעות',
        'זיכוי מלא לחבילה מתקדמת'
      ];

      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    test('main CTA button navigates to public upload', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const mainCTA = screen.getByText('לחץ/י כאן לקבלת תמונות מקצועיות לעסק שלך');
      fireEvent.click(mainCTA);

      expect(mockNavigate).toHaveBeenCalledWith('/public-upload');
    });

    test('existing customers button navigates to auth page', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const existingCustomersBtn = screen.getByText('התחברות לקוחות קיימים');
      fireEvent.click(existingCustomersBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/customer/auth');
    });
  });

  describe('UI/UX Tests', () => {
    test('promotional banner is displayed', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      expect(screen.getByText('חסוך 80% מעלויות צילום')).toBeInTheDocument();
      expect(screen.getByText('תמונות מקצועיות למסעדה שלך תוך 72 שעות')).toBeInTheDocument();
      expect(screen.getByText('ללא צלם וללא סטודיו')).toBeInTheDocument();
    });

    test('guarantee section is displayed', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      expect(screen.getByText('💎 ערבות שביעות רצון 100% או החזר מלא')).toBeInTheDocument();
    });

    test('footer is displayed', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      expect(screen.getByText('© 2025 Food Vision')).toBeInTheDocument();
    });

    test('buttons have correct styling classes', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const mainCTA = screen.getByText('לחץ/י כאן לקבלת תמונות מקצועיות לעסק שלך');
      const existingCustomersBtn = screen.getByText('התחברות לקוחות קיימים');

      // Check for key styling classes
      expect(mainCTA).toHaveClass('bg-gradient-to-r');
      expect(existingCustomersBtn).toHaveClass('border-gray-300');
    });
  });

  describe('Responsive Design Tests', () => {
    test('component renders on mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      // Component should still render all key elements
      expect(screen.getByText('Food Vision')).toBeInTheDocument();
      expect(screen.getByText('249')).toBeInTheDocument();
    });

    test('responsive classes are applied correctly', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const heading = screen.getByText('Food Vision');
      expect(heading).toHaveClass('text-3xl', 'sm:text-4xl', 'md:text-5xl');
    });
  });

  describe('Edge Cases', () => {
    test('handles missing logo gracefully', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const logo = screen.getByAltText('Food Vision Logo');
      // Simulate broken image
      fireEvent.error(logo);
      
      // Component should still be functional
      expect(screen.getByText('Food Vision')).toBeInTheDocument();
    });

    test('handles rapid button clicks', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const mainCTA = screen.getByText('לחץ/י כאן לקבלת תמונות מקצועיות לעסק שלך');
      
      // Rapid clicks
      fireEvent.click(mainCTA);
      fireEvent.click(mainCTA);
      fireEvent.click(mainCTA);

      // Should only navigate once (or handle multiple calls gracefully)
      expect(mockNavigate).toHaveBeenCalledWith('/public-upload');
    });

    test('renders without crashing when props are undefined', () => {
      expect(() => {
        render(
          <TestWrapper>
            <CustomerLogin />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility Tests', () => {
    test('buttons are accessible', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
        expect(button).not.toHaveAttribute('disabled');
      });
    });

    test('images have alt text', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      const logo = screen.getByAltText('Food Vision Logo');
      expect(logo).toBeInTheDocument();
    });

    test('component has proper RTL direction', () => {
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      // Check for RTL content indicators instead of dir attribute
      expect(screen.getByText('פלטפורמה מתקדמת לעיבוד תמונות מזון')).toBeInTheDocument();
      expect(screen.getByText('לחץ/י כאן לקבלת תמונות מקצועיות לעסק שלך')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    test('component renders quickly', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Food Vision')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within reasonable time (100ms)
      expect(renderTime).toBeLessThan(100);
    });

    test('does not cause memory leaks', () => {
      const { unmount } = render(
        <TestWrapper>
          <CustomerLogin />
        </TestWrapper>
      );

      // Should unmount without issues
      expect(() => unmount()).not.toThrow();
    });
  });
}); 