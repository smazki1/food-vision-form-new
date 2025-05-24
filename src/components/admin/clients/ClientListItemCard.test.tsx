/// <reference types="vitest/globals" />

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientListItemCard } from './ClientListItemCard';
import { Client, ClientStatus } from '@/types/client';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const originalModule = await vi.importActual('react-router-dom');
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
  };
});

const mockClient: Client = {
  client_id: 'client1',
  restaurant_name: 'The Golden Spoon',
  contact_name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '555-1234', // Changed from phone_number
  client_status: 'פעיל' as ClientStatus, // Active
  created_at: new Date().toISOString(),
  original_lead_id: null,
  last_activity_at: new Date().toISOString(),
  internal_notes: 'Loyal customer',
  user_auth_id: 'user-auth-123',
  current_package_id: 'pkg1',
  remaining_servings: 50,
  email_notifications: true,
  app_notifications: false,
  service_packages: {
    package_name: 'Standard Package',
    total_servings: 100,
  }
  // Removed: address, notes (use internal_notes), package_name, package_total_servings (moved to service_packages),
  // package_start_date, package_end_date, monthly_fee, renewal_date, payment_status, profile_picture_url
  // Note: updated_at is not in the Client type, created_at and last_activity_at cover timestamps
};

describe('ClientListItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render client details correctly', () => {
    render(<ClientListItemCard client={mockClient} />);

    // Check for restaurant name
    expect(screen.getByText(mockClient.restaurant_name)).toBeInTheDocument();

    // Check for contact name and email within the specific p tag
    const infoParagraph = screen.getByText((content, element) => {
      return element?.tagName.toLowerCase() === 'p' && 
             content.includes(mockClient.contact_name) && 
             content.includes(mockClient.email);
    });
    expect(infoParagraph).toBeInTheDocument();
    expect(within(infoParagraph).getByText(mockClient.contact_name, { exact: false })).toBeInTheDocument();
    
    // Check for status badge
    expect(screen.getByText(mockClient.client_status)).toBeInTheDocument();

    // Check for avatar fallback (initials)
    // Assuming the Avatar component renders the first letter of the restaurant_name as fallback
    const firstLetter = mockClient.restaurant_name.charAt(0).toUpperCase();
    // The initials are rendered within a specific span structure by shadcn/ui Avatar
    // We'll look for the text content directly.
    expect(screen.getByText(firstLetter)).toBeInTheDocument();
    
    // Check for "View Details" button
    const viewDetailsButton = screen.getByRole('button', { name: /צפייה/i }); // Corrected name
    expect(viewDetailsButton).toBeInTheDocument();
  });

  it('should navigate to client details page on "View Details" button click', async () => {
    render(<ClientListItemCard client={mockClient} />);
    
    const viewDetailsButton = screen.getByRole('button', { name: /צפייה/i }); // Corrected name
    await userEvent.click(viewDetailsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(`/admin/clients/${mockClient.client_id}`);
  });

  // Removed test for fallback avatar as profile_picture_url does not exist

  // Add more tests as needed:
  // - Different client statuses and how they are displayed
  // - Missing optional fields (e.g., if contact_name is optional)
}); 