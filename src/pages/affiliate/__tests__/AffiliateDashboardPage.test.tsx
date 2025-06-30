import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AffiliateDashboardPage from '../AffiliateDashboardPage';

// Mock the useAffiliateAuth hook
vi.mock('@/hooks/useAffiliate', () => ({
  useAffiliateAuth: vi.fn()
}));

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <div data-testid="card-title" {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div data-testid="card-description" {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div data-testid="card-content" {...props}>{children}</div>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button data-testid="button" {...props}>{children}</button>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => <span data-testid="badge" {...props}>{children}</span>
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Users: () => <div data-testid="users-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Package: () => <div data-testid="package-icon" />,
  Award: () => <div data-testid="award-icon" />
}));

// Import the mocked hook after setting up the mock
import { useAffiliateAuth } from '@/hooks/useAffiliate';
const mockUseAffiliateAuth = useAffiliateAuth as ReturnType<typeof vi.fn>;

describe('AffiliateDashboardPage', () => {
  const mockAffiliate = {
    affiliate_id: 'test-id',
    email: 'test@test.com',
    name: 'Test Name'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Loading States', () => {
    it('should show loading spinner', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: null,
        isAffiliate: false,
        isLoading: true,
        error: null,
        affiliateId: null
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText('טוען נתוני דאשבורד...')).toBeInTheDocument();
      expect(screen.queryByText('שלום')).not.toBeInTheDocument();
    });

    it('should show loading spinner with proper styling', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: null,
        isAffiliate: false,
        isLoading: true,
        error: null,
        affiliateId: null
      });

      const { container } = render(<AffiliateDashboardPage />);

      // Target the outer container instead of the text container
      const loadingContainer = container.querySelector('.flex.items-center.justify-center.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe('Error States - No Affiliate', () => {
    it('should show debug information when no affiliate is found', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: null,
        isAffiliate: false,
        isLoading: false,
        error: null,
        affiliateId: null
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText('שגיאת גישה')).toBeInTheDocument();
      expect(screen.getByText('לא נמצא חשבון שותף. אנא פנה למנהל המערכת.')).toBeInTheDocument();
    });
  });

  describe('Happy Path - Valid Affiliate Data', () => {
    it('should render affiliate dashboard with valid data', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: mockAffiliate,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: mockAffiliate.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText(`שלום ${mockAffiliate.name}`)).toBeInTheDocument();
      expect(screen.getByText('דאשבורד שותפים - Food Vision AI')).toBeInTheDocument();
      expect(screen.getByText(`Affiliate ID: ${mockAffiliate.affiliate_id}`)).toBeInTheDocument();
      // Use getAllByText and select the first one to handle duplicates
      expect(screen.getAllByText(`Email: ${mockAffiliate.email}`)[0]).toBeInTheDocument();
    });

    it('should display stats cards with Hebrew text', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: mockAffiliate,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: mockAffiliate.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText('לקוחות פעילים')).toBeInTheDocument();
      expect(screen.getByText('סה"כ עמלות')).toBeInTheDocument();
      expect(screen.getByText('חבילות פעילות')).toBeInTheDocument();
    });

    it('should render action buttons', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: mockAffiliate,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: mockAffiliate.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText('רכוש חבילה חדשה')).toBeInTheDocument();
      expect(screen.getByText('צפה בלקוחות')).toBeInTheDocument();
      expect(screen.getByText('דוח עמלות')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle affiliate with empty name', async () => {
      const affiliateWithoutName = { ...mockAffiliate, name: '' };
      
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: affiliateWithoutName,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: affiliateWithoutName.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      // Use getByRole to target the heading element instead of text matcher
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('שלום');
    });

    it('should handle affiliate with special characters in name', async () => {
      const affiliateWithSpecialName = { ...mockAffiliate, name: 'שם עם תווים מיוחדים!@#' };
      
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: affiliateWithSpecialName,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: affiliateWithSpecialName.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText(`שלום ${affiliateWithSpecialName.name}`)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should have RTL direction on main container', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: mockAffiliate,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: mockAffiliate.affiliate_id
      });

      const { container } = render(<AffiliateDashboardPage />);

      const mainContainer = container.querySelector('[dir="rtl"]');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render debug info section', async () => {
      mockUseAffiliateAuth.mockReturnValue({
        affiliate: mockAffiliate,
        isAffiliate: true,
        isLoading: false,
        error: null,
        affiliateId: mockAffiliate.affiliate_id
      });

      render(<AffiliateDashboardPage />);

      expect(screen.getByText('מידע להדגבה')).toBeInTheDocument();
      expect(screen.getByText('Status: ההתחברות עובדת!')).toBeInTheDocument();
    });
  });
}); 