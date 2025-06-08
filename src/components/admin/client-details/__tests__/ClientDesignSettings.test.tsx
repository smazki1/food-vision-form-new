import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientDesignSettings } from '../ClientDesignSettings';
import { Client } from '@/types/client';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock Supabase operations
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

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn()
  })
}));

// Mock client data
const mockClient: Client = {
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
};

describe('ClientDesignSettings', () => {
  it('renders without crashing', () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    // Component shows loading spinner while fetching data
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
    expect(loadingSpinner).toHaveClass('border-b-2', 'border-primary');
  });

  it('has proper component structure', () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Check for main card structure
    const heading = screen.getByText('תמונות ייחוס ועיצוב');
    expect(heading).toBeInTheDocument();
    
    // Check for palette icon
    const paletteIcon = document.querySelector('.lucide-palette');
    expect(paletteIcon).toBeInTheDocument();
  });

  it('renders with different client props', () => {
    const clientWithNullNotes = { ...mockClient, internal_notes: null };
    render(<ClientDesignSettings clientId="test-client-1" client={clientWithNullNotes} />);
    expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
  });

  it('handles basic component lifecycle', () => {
    const { unmount } = render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Component renders successfully
    expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
    
    // Component can be unmounted without errors
    unmount();
  });
}); 