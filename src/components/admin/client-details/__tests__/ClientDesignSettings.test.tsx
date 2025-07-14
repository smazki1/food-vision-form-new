import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { internal_notes: null }, 
            error: null 
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test-url.com' } }))
      }))
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
  internal_notes: '{"referenceImages":[],"fixedPrompts":[]}',
  remaining_servings: 10,
  remaining_images: 20,
  consumed_images: 5,
  reserved_images: 3,
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

  it('renders fixed prompts section', async () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
    });
  });

  it('shows empty state for fixed prompts', async () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('אין Prompts קבועים עדיין')).toBeInTheDocument();
    });
  });

  it('has add prompt button', async () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Wait for component to load
    await waitFor(() => {
      const addButton = screen.getByText('הוסף Prompt');
      expect(addButton).toBeInTheDocument();
    });
  });

  it('shows fixed prompts section with proper icons', async () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Wait for component to load
    await waitFor(() => {
      const messageSquareIcon = document.querySelector('.lucide-message-square');
      expect(messageSquareIcon).toBeInTheDocument();
    });
  });

  it('renders the main layout structure correctly', async () => {
    render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
    
    // Wait for component to load
    await waitFor(() => {
      // Check for reference images section
      expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
      
      // Check for fixed prompts section
      expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
      
      // Both sections should be present
      expect(screen.getByText('הוסף תמונת ייחוס')).toBeInTheDocument();
      expect(screen.getByText('הוסף Prompt')).toBeInTheDocument();
    });
  });
}); 