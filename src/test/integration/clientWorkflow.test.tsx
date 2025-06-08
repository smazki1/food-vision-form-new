import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientDetailPanel } from '@/components/admin/client-details/ClientDetailPanel';

// Simple mock for dependencies
vi.mock('@/hooks/useClients', () => ({
  useClients: () => ({
    clients: [{
      client_id: 'test-client-1',
      restaurant_name: 'Test Restaurant',
      contact_name: 'John Doe',
      phone: '123-456-7890',
      email: 'john@test.com',
      client_status: 'פעיל',
      business_type: 'מסעדה',
      address: '123 Test St',
      website_url: 'https://test.com',
      internal_notes: '{"referenceImages":[]}',
      remaining_servings: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      current_package_id: null,
      user_auth_id: null,
      service_packages: null,
      original_lead_id: null,
      last_activity_at: '2024-01-01T00:00:00Z'
    }],
    isLoading: false,
    error: null
  })
}));

vi.mock('@/hooks/useClientUpdate', () => ({
  useClientUpdate: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isLoading: false
  })
}));

// Mock other dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: { internal_notes: '{"referenceImages":[]}' },
            error: null
          })
        })
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null })
      })
    }),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ 
          data: { path: 'test-path' }, 
          error: null 
        }),
        getPublicUrl: () => ({ 
          data: { publicUrl: 'https://test.com/image.jpg' } 
        })
      })
    }
  }
}));

describe('Client Workflow Integration Tests', () => {
  describe('Panel Structure', () => {
    it('renders client detail panel successfully', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      // Should render the client name
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
    });

    it('displays all required tabs', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      // Check for tab structure
      expect(screen.getByText('פרטי הלקוח')).toBeInTheDocument();
      expect(screen.getByText('חבילות ומנויים')).toBeInTheDocument();
      expect(screen.getByText('תפריט והגשות')).toBeInTheDocument();
      expect(screen.getByText('פעילות והערות')).toBeInTheDocument();
      expect(screen.getByText('תשלומים וחשבונות')).toBeInTheDocument();
    });

    it('shows correct status badge', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      const statusBadge = screen.getByText('פעיל');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');
    });
  });

  describe('Client Information Display', () => {
    it('displays basic client information', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123-456-7890')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
    });

    it('handles missing client gracefully', () => {
      render(<ClientDetailPanel clientId="non-existent-client" onClose={() => {}} />);
      
      expect(screen.getByText('לקוח לא נמצא')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('renders tabs without navigation testing', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      // Just verify tabs exist - navigation testing requires more complex setup
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);
    });
  });

  describe('Component Integration', () => {
    it('maintains proper component hierarchy', () => {
      const { container } = render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      // Check for proper sheet structure
      const sheet = container.querySelector('[role="dialog"]');
      expect(sheet).toBeInTheDocument();
    });

    it('includes required icons and visual elements', () => {
      render(<ClientDetailPanel clientId="test-client-1" onClose={() => {}} />);
      
      // Check for avatar/initial
      const avatar = screen.getByText('T'); // First letter of "Test Restaurant"
      expect(avatar).toBeInTheDocument();
    });
  });
}); 