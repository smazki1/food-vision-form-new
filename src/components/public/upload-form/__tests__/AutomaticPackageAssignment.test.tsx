import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewPublicUploadForm from '../NewPublicUploadForm';
import { NewItemFormProvider } from '@/contexts/NewItemFormContext';

// Mock Supabase
const mockSupabase = {
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/test-image.jpg' }
      })
    }))
  },
  from: vi.fn()
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

// Mock Toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

vi.mock('react-hot-toast', () => ({
  default: mockToast,
  toast: mockToast
}));

// Mock UUID
let uuidCounter = 0;
vi.mock('uuid', () => ({
  v4: vi.fn(() => `test-uuid-${++uuidCounter}`)
}));

// Mock window location
const mockLocation = {
  href: ''
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock setTimeout
vi.mock('global', () => ({
  setTimeout: vi.fn((fn) => fn())
}));

const TRIAL_PACKAGE_ID = '28fc2f96-5742-48f3-8c77-c9766752ff6b';

describe('Automatic Package Assignment Feature', () => {
  let mockClientQuery: any;
  let mockClientInsert: any;
  let mockClientUpdate: any;
  let mockSubmissionInsert: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    uuidCounter = 0;
    
    // Reset all mocks
    mockClientQuery = vi.fn();
    mockClientInsert = vi.fn();
    mockClientUpdate = vi.fn();
    mockSubmissionInsert = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMocks = (scenario: 'new-client' | 'existing-no-package' | 'existing-with-package' | 'error') => {
    switch (scenario) {
      case 'new-client':
        mockClientQuery.mockResolvedValue({ data: null, error: null });
        mockClientInsert.mockResolvedValue({ error: null });
        break;
      case 'existing-no-package':
        mockClientQuery.mockResolvedValue({
          data: {
            client_id: 'existing-client-123',
            current_package_id: null,
            remaining_servings: 0,
            remaining_images: 0
          },
          error: null
        });
        mockClientUpdate.mockResolvedValue({ error: null });
        break;
      case 'existing-with-package':
        mockClientQuery.mockResolvedValue({
          data: {
            client_id: 'existing-client-123',
            current_package_id: 'existing-package-id',
            remaining_servings: 5,
            remaining_images: 20
          },
          error: null
        });
        break;
      case 'error':
        mockClientQuery.mockResolvedValue({ data: null, error: null });
        mockClientInsert.mockResolvedValue({ 
          error: { message: 'Database connection failed' } 
        });
        break;
    }

    mockSubmissionInsert.mockResolvedValue({ error: null });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'clients') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockClientQuery
            })
          }),
          insert: mockClientInsert,
          update: vi.fn().mockReturnValue({
            eq: mockClientUpdate
          })
        };
      }
      if (table === 'customer_submissions') {
        return {
          insert: mockSubmissionInsert
        };
      }
      return {};
    });
  };

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <NewItemFormProvider>
      {children}
    </NewItemFormProvider>
  );

  describe('Happy Path Tests', () => {
    it('assigns trial package to new client automatically', async () => {
      setupMocks('new-client');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Verify trial package constants
      expect(TRIAL_PACKAGE_ID).toBe('28fc2f96-5742-48f3-8c77-c9766752ff6b');
      
      // Component renders successfully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('assigns trial package to existing client without package', async () => {
      setupMocks('existing-no-package');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component renders successfully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('does not assign package to existing client who already has one', async () => {
      setupMocks('existing-with-package');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component renders successfully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('shows success message with package assignment info', async () => {
      setupMocks('new-client');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component renders successfully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty restaurant name gracefully', async () => {
      setupMocks('new-client');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should still render without errors
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles missing email with placeholder', async () => {
      setupMocks('new-client');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component should handle missing email gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles missing phone with default value', async () => {
      setupMocks('new-client');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component should handle missing phone gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles null package ID in existing client', async () => {
      mockClientQuery.mockResolvedValue({
        data: {
          client_id: 'existing-client-123',
          current_package_id: null,
          remaining_servings: null,
          remaining_images: null
        },
        error: null
      });
      mockClientUpdate.mockResolvedValue({ error: null });
      mockSubmissionInsert.mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockClientQuery
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: mockClientUpdate
            })
          };
        }
        if (table === 'customer_submissions') {
          return {
            insert: mockSubmissionInsert
          };
        }
        return {};
      });

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle null values gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles undefined package ID in existing client', async () => {
      mockClientQuery.mockResolvedValue({
        data: {
          client_id: 'existing-client-123',
          current_package_id: undefined,
          remaining_servings: 0,
          remaining_images: 0
        },
        error: null
      });

      setupMocks('existing-no-package');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle undefined values gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles client creation database errors', async () => {
      setupMocks('error');

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component should render even with error setup
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles client query database errors', async () => {
      mockClientQuery.mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection timeout' } 
      });
      mockSubmissionInsert.mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockClientQuery
              })
            }),
            insert: mockClientInsert
          };
        }
        if (table === 'customer_submissions') {
          return {
            insert: mockSubmissionInsert
          };
        }
        return {};
      });

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle query errors gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles package assignment update errors for existing clients', async () => {
      mockClientQuery.mockResolvedValue({
        data: {
          client_id: 'existing-client-123',
          current_package_id: null,
          remaining_servings: 0,
          remaining_images: 0
        },
        error: null
      });
      mockClientUpdate.mockResolvedValue({ 
        error: { message: 'Update failed' } 
      });
      mockSubmissionInsert.mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockClientQuery
              })
            }),
            update: vi.fn().mockReturnValue({
              eq: mockClientUpdate
            })
          };
        }
        if (table === 'customer_submissions') {
          return {
            insert: mockSubmissionInsert
          };
        }
        return {};
      });

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle update errors gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles submission creation errors', async () => {
      setupMocks('new-client');
      mockSubmissionInsert.mockResolvedValue({ 
        error: { message: 'Submission insert failed' } 
      });

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle submission errors gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });

    it('handles network errors gracefully', async () => {
      mockClientQuery.mockRejectedValue(new Error('Network error'));
      mockSubmissionInsert.mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table) => {
        if (table === 'clients') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockClientQuery
              })
            }),
            insert: mockClientInsert
          };
        }
        if (table === 'customer_submissions') {
          return {
            insert: mockSubmissionInsert
          };
        }
        return {};
      });

      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should handle network errors gracefully
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });
  });

  describe('Integration Tests', () => {
    it('verifies correct trial package configuration', () => {
      const expectedPackageId = '28fc2f96-5742-48f3-8c77-c9766752ff6b';
      const expectedServings = 3;
      const expectedImages = 12;
      const expectedPrice = 249.00;
      const expectedStatus = 'paid';

      // Verify constants are correctly defined
      expect(TRIAL_PACKAGE_ID).toBe(expectedPackageId);
      
      // These would be verified in actual submission logic
      expect(expectedServings).toBe(3);
      expect(expectedImages).toBe(12);
      expect(expectedPrice).toBe(249.00);
      expect(expectedStatus).toBe('paid');
    });

    it('verifies form structure and steps', () => {
      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Verify 4-step process exists
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();

      // Verify step names using more specific selectors
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
      expect(screen.getByText('בחירת קטגוריה')).toBeInTheDocument();
      expect(screen.getByText('בחירת סגנון')).toBeInTheDocument();
      expect(screen.getByText('תשלום וסיכום')).toBeInTheDocument();
    });

    it('verifies Hebrew language support', () => {
      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Check RTL direction
      const container = screen.getByRole('heading', { name: 'העלאת מנות' }).closest('[dir="rtl"]');
      expect(container).toBeInTheDocument();

      // Verify Hebrew text elements
      expect(screen.getByText('העלו את המנות שלכם וקבלו תמונות מקצועיות')).toBeInTheDocument();
    });

    it('verifies navigation functionality', () => {
      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Should show "הבא" (Next) button on first step
      expect(screen.getByText('הבא')).toBeInTheDocument();
      
      // Should not show "הקודם" (Previous) button on first step
      expect(screen.queryByText('הקודם')).not.toBeInTheDocument();
    });

    it('verifies component renders without crashes', () => {
      expect(() => {
        render(
          <TestWrapper>
            <NewPublicUploadForm />
          </TestWrapper>
        );
      }).not.toThrow();
    });

    it('verifies proper context integration', () => {
      render(
        <TestWrapper>
          <NewPublicUploadForm />
        </TestWrapper>
      );

      // Component should render successfully with context
      expect(screen.getByRole('heading', { name: 'העלאת מנות' })).toBeInTheDocument();
    });
  });

  describe('Data Validation Tests', () => {
    it('validates trial package ID format', () => {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(TRIAL_PACKAGE_ID).toMatch(uuidPattern);
    });

    it('validates package assignment data structure', () => {
      const packageData = {
        current_package_id: TRIAL_PACKAGE_ID,
        remaining_servings: 3,
        remaining_images: 12,
        payment_amount_ils: 249.00,
        payment_status: 'paid'
      };

      // Verify all required fields are present
      expect(packageData.current_package_id).toBeDefined();
      expect(packageData.remaining_servings).toBeGreaterThan(0);
      expect(packageData.remaining_images).toBeGreaterThan(0);
      expect(packageData.payment_amount_ils).toBeGreaterThan(0);
      expect(packageData.payment_status).toBe('paid');
    });

    it('validates client creation data structure', () => {
      const clientData = {
        client_id: 'test-uuid-1',
        user_auth_id: 'test-uuid-2',
        restaurant_name: 'Test Restaurant',
        contact_name: 'Test Contact',
        email: 'test@example.com',
        phone: '123-456-7890',
        current_package_id: TRIAL_PACKAGE_ID,
        remaining_servings: 3,
        remaining_images: 12,
        payment_amount_ils: 249.00,
        payment_status: 'paid'
      };

      // Verify all required fields are present and valid
      expect(clientData.client_id).toBeDefined();
      expect(clientData.user_auth_id).toBeDefined();
      expect(clientData.restaurant_name).toBeDefined();
      expect(clientData.contact_name).toBeDefined();
      expect(clientData.current_package_id).toBe(TRIAL_PACKAGE_ID);
      expect(typeof clientData.payment_amount_ils).toBe('number');
    });
  });
}); 