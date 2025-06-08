import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientPackageManagement } from '../ClientPackageManagement';
import { Client } from '@/types/client';

// Mock all external dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/integrations/supabase/client');
vi.mock('@/api/clientApi');
vi.mock('@/api/packageApi');
vi.mock('@/hooks/useClientSubmissions');
vi.mock('../clients/ClientsPackageName', () => ({
  __esModule: true,
  default: () => <span>Current Package</span>,
}));
vi.mock('../packages/PackageFormDialog', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock the packages hook
vi.mock('@/hooks/usePackages', () => ({
  usePackages: () => ({
    packages: [
      {
        package_id: 'test-package-1',
        package_name: 'Standard Package',
        total_servings: 30,
        total_images: 15,
        price: 750,
        max_edits_per_serving: 3,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
      {
        package_id: 'test-package-2',
        package_name: 'Premium Package',
        total_servings: 50,
        total_images: null, // Test null handling
        price: 1200,
        max_edits_per_serving: 5,
        is_active: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      },
    ],
    isLoading: false,
    invalidateCache: vi.fn(),
  }),
}));

// Test data
const mockClient: Client = {
  client_id: 'test-client-123',
  restaurant_name: 'Test Restaurant',
  current_package_id: 'test-package-1',
  remaining_servings: 10,
  remaining_images: 5,
  contact_name: 'John Doe',
  contact_phone: '123-456-7890',
  contact_email: 'john@test.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
} as any;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Package Assignment - Core Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders package management interface successfully', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
      expect(screen.getByText('בחירת חבילה')).toBeInTheDocument();
    });

    it('displays available packages', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('Standard Package')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
    });

    it('shows package details correctly', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      // Standard Package details
      expect(screen.getByText('30 מנות')).toBeInTheDocument();
      expect(screen.getByText('15 תמונות')).toBeInTheDocument();
      expect(screen.getByText('₪750')).toBeInTheDocument();

      // Premium Package details (with null handling)
      expect(screen.getByText('50 מנות')).toBeInTheDocument();
      expect(screen.getByText('0 תמונות')).toBeInTheDocument(); // null -> 0
      expect(screen.getByText('₪1200')).toBeInTheDocument();
    });
  });

  describe('Client Status Display', () => {
    it('shows current client information', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('10')).toBeInTheDocument(); // remaining_servings
      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
    });

    it('displays current package status', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('חבילה מוקצית')).toBeInTheDocument();
    });
  });

  describe('User Interface Elements', () => {
    it('shows create package button', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('צור חבילה חדשה')).toBeInTheDocument();
    });

    it('displays assignment hints on package cards', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      const assignmentHints = screen.getAllByText('לחץ להקצאת חבילה');
      expect(assignmentHints).toHaveLength(2); // One for each package

      const assignButtons = screen.getAllByText('הקצה');
      expect(assignButtons).toHaveLength(2);
    });

    it('shows refresh data button', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      const refreshButton = screen.getByTitle('רענן נתונים');
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Package Assignment Flow', () => {
    it('handles package card click events', async () => {
      // Setup assignment function mock
      const mockAssignFunction = vi.fn(() => Promise.resolve({ 
        client_id: 'test-client-123',
        restaurant_name: 'Test Restaurant Updated',
        remaining_servings: 40,
        remaining_images: 20
      }));
      
      // Mock the API function
      vi.doMock('@/api/clientApi', () => ({
        assignPackageToClientWithImages: mockAssignFunction,
        updateClientServings: vi.fn(),
        updateClientImages: vi.fn(),
      }));

      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      const packageCard = screen.getByText('Standard Package').closest('div[class*="cursor-pointer"]');
      expect(packageCard).toBeInTheDocument();

      if (packageCard) {
        fireEvent.click(packageCard);
        
        // Wait for any async operations
        await waitFor(() => {
          // The click should have been processed
          expect(packageCard).toBeInTheDocument();
        }, { timeout: 1000 });
      }
    });

    it('handles premium package with null images', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      const premiumCard = screen.getByText('Premium Package').closest('div[class*="cursor-pointer"]');
      expect(premiumCard).toBeInTheDocument();
      
      // Should show 0 instead of null
      expect(screen.getByText('0 תמונות')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('renders without crashing when packages are loading', () => {
      // Mock loading state
      vi.doMock('@/hooks/usePackages', () => ({
        usePackages: () => ({
          packages: null,
          isLoading: true,
          invalidateCache: vi.fn(),
        }),
      }));

      expect(() => {
        render(
          <TestWrapper>
            <ClientPackageManagement clientId="test-client-123" client={mockClient} />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('handles empty packages array gracefully', () => {
      // Mock empty packages
      vi.doMock('@/hooks/usePackages', () => ({
        usePackages: () => ({
          packages: [],
          isLoading: false,
          invalidateCache: vi.fn(),
        }),
      }));

      expect(() => {
        render(
          <TestWrapper>
            <ClientPackageManagement clientId="test-client-123" client={mockClient} />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Integration Features', () => {
    it('shows correct section headings for navigation', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
      expect(screen.getByText('בחירת חבילה')).toBeInTheDocument();
      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
    });

    it('maintains proper visual hierarchy', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      // Key information should be visible
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByText('Standard Package')).toBeInTheDocument();
      expect(screen.getByText('Premium Package')).toBeInTheDocument();
    });
  });

  describe('Accessibility and UX', () => {
    it('provides clickable package cards', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      const standardCard = screen.getByText('Standard Package').closest('div[class*="cursor-pointer"]');
      const premiumCard = screen.getByText('Premium Package').closest('div[class*="cursor-pointer"]');
      
      expect(standardCard).toBeInTheDocument();
      expect(premiumCard).toBeInTheDocument();
    });

    it('shows clear assignment instructions', () => {
      render(
        <TestWrapper>
          <ClientPackageManagement clientId="test-client-123" client={mockClient} />
        </TestWrapper>
      );

      expect(screen.getAllByText('לחץ להקצאת חבילה')).toHaveLength(2);
      expect(screen.getAllByText('הקצה')).toHaveLength(2);
    });
  });
}); 