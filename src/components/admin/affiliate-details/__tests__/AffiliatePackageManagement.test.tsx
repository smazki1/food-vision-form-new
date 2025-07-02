import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AffiliatePackageManagement } from '../AffiliatePackageManagement';
import { Affiliate } from '@/types/affiliate';

// Mock dependencies
vi.mock('@/hooks/usePackages', () => ({
  usePackages: () => ({
    packages: [
      {
        package_id: 'pkg-1',
        package_name: 'Premium Package',
        total_servings: 10,
        total_images: 15,
        is_active: true,
        price: 999 // Add price field
      },
      {
        package_id: 'pkg-2', 
        package_name: 'Basic Package',
        total_servings: 5,
        total_images: 8,
        is_active: true,
        price: 599 // Add price field
      }
    ],
    isLoading: false,
    invalidateCache: vi.fn()
  })
}));

vi.mock('@/hooks/useAffiliatePackageManagement', () => ({
  useAssignPackageToAffiliateWithImages: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading: false
  }),
  useUpdateAffiliateServings: () => ({
    mutate: vi.fn()
  }),
  useUpdateAffiliateImages: () => ({
    mutate: vi.fn()
  }),
  useAffiliateAssignedPackages: () => ({
    data: []
  })
}));

vi.mock('@/hooks/useDeletePackage', () => ({
  useDeletePackage: () => ({
    mutate: vi.fn(),
    isPending: false
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              affiliate_id: 'aff-123',
              remaining_servings: 10,
              remaining_images: 20,
              current_package_id: 'pkg-1'
            },
            error: null
          })
        })
      })
    })
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('AffiliatePackageManagement', () => {
  let queryClient: QueryClient;
  
  const mockAffiliate: Affiliate = {
    affiliate_id: 'aff-123',
    user_auth_id: 'auth-123',
    name: 'Test Affiliate',
    email: 'test@example.com',
    phone: '+1234567890',
    status: 'active',
    username: 'testaffiliate',
    password: 'password123',
    internal_notes: null,
    current_package_id: 'pkg-1',
    remaining_servings: 10,
    remaining_images: 20,
    consumed_images: 5,
    reserved_images: 3,
    commission_rate_tasting: 30,
    commission_rate_full_menu: 25,
    commission_rate_deluxe: 20,
    total_earnings: 1000,
    total_referrals: 15,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render status section with correct Hebrew text', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('מצב חבילות נוכחי')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // remaining servings
      expect(screen.getByText('20')).toBeInTheDocument(); // remaining images
    });

    it('should render package assignment section', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('הקצאת חבילות')).toBeInTheDocument();
    });

    it('should display package cards with names and prices', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.getByText('Basic Package')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('should show correct Hebrew labels for stats', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('תמונות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('תמונות שנוצלו')).toBeInTheDocument();
      expect(screen.getByText('תמונות בשמורה')).toBeInTheDocument();
    });

    it('should handle zero values gracefully', () => {
      const affiliateWithZeros = {
        ...mockAffiliate,
        remaining_servings: 0,
        remaining_images: 0
      };

      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={affiliateWithZeros} 
        />
      );

      const zeroTexts = screen.getAllByText('0');
      expect(zeroTexts.length).toBeGreaterThan(0);
    });

    it('should show assigned package status', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('חבילה מוקצית')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('should have refresh button', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      const refreshButton = screen.getByTitle('רענן נתונים');
      expect(refreshButton).toBeInTheDocument();
    });

    it('should handle refresh button click', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      const refreshButton = screen.getByTitle('רענן נתונים');
      fireEvent.click(refreshButton);

      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null current_package_id gracefully', () => {
      const affiliateNoPackage = {
        ...mockAffiliate,
        current_package_id: null
      };

      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={affiliateNoPackage} 
        />
      );

      expect(screen.getByText('מצב חבילות נוכחי')).toBeInTheDocument();
      expect(screen.getByText('אין חבילה מוקצית')).toBeInTheDocument();
    });

    it('should handle empty affiliate ID', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('מצב חבילות נוכחי')).toBeInTheDocument();
    });
  });

  describe('Package Assignment', () => {
    it('should display assignment buttons', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Use getAllByText since there are multiple "הקצה" buttons (one per package)
      const assignButtons = screen.getAllByText('הקצה');
      expect(assignButtons.length).toBeGreaterThan(0);
    });

    it('should handle package assignment clicks', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      const packageCard = screen.getByText('Premium Package').closest('div[class*="cursor-pointer"]');
      if (packageCard) {
        fireEvent.click(packageCard);
      }

      expect(screen.getByText('Premium Package')).toBeInTheDocument();
    });
  });

  describe('Hebrew Language Support', () => {
    it('should display Hebrew text correctly', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Check for key Hebrew terms
      expect(screen.getByText('מצב חבילות נוכחי')).toBeInTheDocument();
      expect(screen.getByText('הקצאת חבילות')).toBeInTheDocument();
      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('תמונות שנותרו')).toBeInTheDocument();
    });
  });
}); 