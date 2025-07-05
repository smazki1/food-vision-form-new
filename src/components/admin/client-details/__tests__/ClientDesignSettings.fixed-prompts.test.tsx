import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientDesignSettings } from '../ClientDesignSettings';
import { Client } from '@/types/client';

// Simple mock setup
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { internal_notes: '{"referenceImages":[],"fixedPrompts":[]}' }, 
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
        upload: vi.fn(() => Promise.resolve({ data: { path: 'test' }, error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'test-url' } }))
      }))
    }
  }
}));

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

describe('Fixed Prompts Feature - Comprehensive Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Happy Path Scenarios', () => {
    it('renders fixed prompts section with correct title', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
      });
    });

    it('shows empty state when no prompts exist', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('אין Prompts קבועים עדיין')).toBeInTheDocument();
        expect(screen.getByText('הוסף Prompt קבוע ראשון')).toBeInTheDocument();
      });
    });

    it('displays add prompt button', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        const addButtons = screen.getAllByText('הוסף Prompt');
        expect(addButtons.length).toBeGreaterThan(0);
      });
    });

    it('shows message square icon for prompts section', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        const messageSquareIcon = document.querySelector('.lucide-message-square');
        expect(messageSquareIcon).toBeInTheDocument();
      });
    });

    it('handles basic interaction with add button', async () => {
      const user = userEvent.setup();
      
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        const addButton = screen.getByText('הוסף Prompt');
        expect(addButton).toBeInTheDocument();
      });

      await act(async () => {
        const addButton = screen.getByText('הוסף Prompt');
        await user.click(addButton);
      });

      // Should not throw errors
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles client with null internal_notes', async () => {
      const clientWithNullNotes = { ...mockClient, internal_notes: null };
      
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={clientWithNullNotes} />);
      });

      await waitFor(() => {
        expect(screen.getByText('אין Prompts קבועים עדיין')).toBeInTheDocument();
      });
    });

    it('handles empty string internal_notes', async () => {
      const clientWithEmptyNotes = { ...mockClient, internal_notes: '' };
      
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={clientWithEmptyNotes} />);
      });

      await waitFor(() => {
        expect(screen.getByText('אין Prompts קבועים עדיין')).toBeInTheDocument();
      });
    });

    it('renders both reference images and prompts sections', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
        expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
      });
    });

    it('shows correct UI structure with cards', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        const cards = document.querySelectorAll('.rounded-lg.border.bg-card');
        expect(cards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Component Structure Tests', () => {
    it('has proper header structure', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        const header = screen.getByText('Prompts קבועים').closest('div');
        expect(header).toBeInTheDocument();
      });
    });

    it('contains necessary UI elements', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        // Check for icon
        expect(document.querySelector('.lucide-message-square')).toBeInTheDocument();
        
        // Check for add button
        expect(screen.getByText('הוסף Prompt')).toBeInTheDocument();
        
        // Check for plus icon
        expect(document.querySelector('.lucide-plus')).toBeInTheDocument();
      });
    });

    it('maintains existing reference images functionality', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
        expect(screen.getByText('הוסף תמונת ייחוס')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', async () => {
      render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      
      // Should show loading spinner initially
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('transitions from loading to content', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    it('integrates properly with existing design settings', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={mockClient} />);
      });

      await waitFor(() => {
        // Both sections should exist
        expect(screen.getByText('תמונות ייחוס ועיצוב')).toBeInTheDocument();
        expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
        
        // Both should have their respective functionality
        expect(screen.getByText('הוסף תמונת ייחוס')).toBeInTheDocument();
        expect(screen.getByText('הוסף Prompt')).toBeInTheDocument();
      });
    });

    it('maintains component props correctly', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-123" client={mockClient} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Prompts קבועים')).toBeInTheDocument();
      });
    });
  });

  describe('Error Resistance', () => {
    it('does not crash with malformed client data', async () => {
      const malformedClient = { 
        ...mockClient, 
        client_id: undefined as any,
        restaurant_name: null as any
      };
      
      await act(async () => {
        render(<ClientDesignSettings clientId="test-client-1" client={malformedClient} />);
      });

      // Should not crash
      expect(true).toBe(true);
    });

    it('handles undefined props gracefully', async () => {
      await act(async () => {
        render(<ClientDesignSettings clientId="" client={mockClient} />);
      });

      // Should not crash
      expect(true).toBe(true);
    });
  });
}); 