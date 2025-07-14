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
        price: 499
      }
    ],
    isLoading: false,
    invalidateCache: vi.fn()
  })
}));

vi.mock('@/hooks/useAffiliatePackageManagement', () => ({
  useAssignPackageToAffiliateWithImages: () => ({
    mutateAsync: vi.fn(),
    isPending: false
  }),
  useUpdateAffiliateServings: () => ({
    mutate: vi.fn(),
    isPending: false
  }),
  useUpdateAffiliateImages: () => ({
    mutate: vi.fn(),
    isPending: false
  }),
  useAffiliateAssignedPackages: () => ({
    data: []
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              affiliate_id: 'aff-123',
              current_package_id: 'pkg-1',
              remaining_servings: 10,
              remaining_images: 20
            },
            error: null
          }))
        }))
      }))
    }))
  }
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/api/packageApi', () => ({
  deletePackage: vi.fn()
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
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
  });

  describe('Component Rendering', () => {
    it('should render the main component structure', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
      expect(screen.getByText('חבילה מוקצית')).toBeInTheDocument();
      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('תמונות שנותרו')).toBeInTheDocument();
    });

    it('should display affiliate package status correctly', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('פעיל')).toBeInTheDocument();
      
      // Check for the circular displays which contain the numbers
      const tensElements = screen.getAllByText('10');
      const twentiesElements = screen.getAllByText('20');
      
      // Should have multiple instances (circular display + other references)
      expect(tensElements.length).toBeGreaterThan(0);
      expect(twentiesElements.length).toBeGreaterThan(0);
    });

    it('should show package assignment section', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('הקצאת חבילות חדשות')).toBeInTheDocument();
      expect(screen.getByText('צור חבילה חדשה')).toBeInTheDocument();
    });
  });

  describe('Quantity Controls', () => {
    it('should display quantity adjustment buttons', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Check for minus and plus buttons (there should be 4 total - 2 for servings, 2 for images)
      const minusButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('lucide-minus')
      );
      const plusButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('lucide-plus')
      );
      
      expect(minusButtons.length).toBe(2); // One for servings, one for images
      expect(plusButtons.length).toBe(3); // Two for quantities, one for "צור חבילה חדשה"
    });

    it('should show circular quantity displays', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Check for circular displays with purple background
      const circularDisplays = screen.getAllByText('10').concat(screen.getAllByText('20'));
      expect(circularDisplays.length).toBeGreaterThan(0);
    });
  });

  describe('Package Assignment', () => {
    it('should display available packages', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('Premium Package')).toBeInTheDocument();
      expect(screen.getByText('Basic Package')).toBeInTheDocument();
    });

    it('should display assignment buttons', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Look for "הקצה חבילה" text in assignment buttons
      const assignButtons = screen.getAllByText('הקצה חבילה');
      expect(assignButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Refresh Functionality', () => {
    it('should display refresh button', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      // Look for refresh button by icon instead of title
      const refreshButtons = screen.getAllByRole('button').filter(button => 
        button.querySelector('svg')?.classList.contains('lucide-refresh-cw')
      );
      expect(refreshButtons.length).toBe(1);
    });

    it('should handle refresh button click', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      const refreshButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg')?.classList.contains('lucide-refresh-cw')
      );
      expect(refreshButton).toBeTruthy();
      
      if (refreshButton) {
        fireEvent.click(refreshButton);
        // Button should be present and clickable
        expect(refreshButton).toBeInTheDocument();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle null current_package_id gracefully', () => {
      const affiliateWithoutPackage = { ...mockAffiliate, current_package_id: null };
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={affiliateWithoutPackage} 
        />
      );

      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
      expect(screen.getByText('לא מוקצית')).toBeInTheDocument();
    });

    it('should handle empty affiliate ID', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
    });
  });

  describe('Statistics Section', () => {
    it('should display statistics', () => {
      renderWithProviders(
        <AffiliatePackageManagement 
          affiliateId="aff-123" 
          affiliate={mockAffiliate} 
        />
      );

      expect(screen.getByText('סטטיסטיקות')).toBeInTheDocument();
      expect(screen.getByText('בהגשות:')).toBeInTheDocument();
      expect(screen.getByText('ממתינות:')).toBeInTheDocument();
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

      // Check for key Hebrew terms in the new design
      expect(screen.getByText('חבילה נוכחית')).toBeInTheDocument();
      expect(screen.getByText('הקצאת חבילות חדשות')).toBeInTheDocument();
      expect(screen.getByText('מנות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('תמונות שנותרו')).toBeInTheDocument();
      expect(screen.getByText('סטטיסטיקות')).toBeInTheDocument();
    });
  });
});