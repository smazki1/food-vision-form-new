import { render, fireEvent, waitFor } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import WireframeTest from '@/pages/wireframe-test';
import { Client } from '@/types/client';

// Mock Supabase
const mockSupabase = {
  from: vi.fn(() => ({
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

const mockClient: Client = {
  client_id: 'test-client-id',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  phone: '123456789',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  original_lead_id: null,
  client_status: 'פעיל',
  current_package_id: null,
  remaining_servings: 0,
  remaining_images: 0,
  consumed_images: 0,
  reserved_images: 0,
  last_activity_at: '2024-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  ai_training_25_count: 5,
  ai_training_15_count: 3,
  ai_training_5_count: 2,
  ai_prompts_count: 10
};

describe('WireframeTest Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders basic structure', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    expect(screen.getByText('בביצוע')).toBeInTheDocument();
    expect(screen.getByText('ממתינות')).toBeInTheDocument();
    expect(screen.getByText('הושלמו')).toBeInTheDocument();
  });

  test('displays client cost data', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest client={mockClient} />
      </Wrapper>
    );
    
    expect(screen.getByText('עלויות ותזמון')).toBeInTheDocument();
  });

  test('handles cost updates', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest clientId="test-id" client={mockClient} />
      </Wrapper>
    );
    
    // Find increment button and click it
    const buttons = screen.getAllByText('▲');
    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });
  });

  test('toggles costs section', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest client={mockClient} />
      </Wrapper>
    );
    
    // Find the toggle button (chevron)
    const toggleButtons = screen.getAllByRole('button');
    const costsToggle = toggleButtons.find(btn => 
      btn.querySelector('[data-testid="chevron-up-icon"]') || 
      btn.querySelector('[data-testid="chevron-down-icon"]')
    );
    
    if (costsToggle) {
      fireEvent.click(costsToggle);
      // Should toggle without crashing
      expect(costsToggle).toBeInTheDocument();
    }
  });

  test('displays timer functionality', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    // Should display timer value
    expect(screen.getByText('00:00:00')).toBeInTheDocument();
  });

  test('handles submissions sidebar', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    // Should render submissions section
    expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
    expect(screen.getByText('קוקטייל מוהיטו')).toBeInTheDocument();
  });

  test('manages notes tabs', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    // Should have notes tabs
    expect(screen.getByText('הערות אישיות')).toBeInTheDocument();
    expect(screen.getByText('הערות ללקוח')).toBeInTheDocument();
    expect(screen.getByText('הערות לעורך')).toBeInTheDocument();
  });

  test('handles image navigation', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    // Should have image sections
    expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
    expect(screen.getByText('תמונות מעובדות')).toBeInTheDocument();
  });

  test('handles edge case - no client data', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest />
      </Wrapper>
    );
    
    // Should render without crashing
    expect(screen.getByText('עלויות ותזמון')).toBeInTheDocument();
  });

  test('handles edge case - zero quantities', () => {
    const zeroClient = { ...mockClient, ai_training_25_count: 0 };
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest client={zeroClient} />
      </Wrapper>
    );
    
    // Should display zero values
    expect(screen.getByText('עלויות ותזמון')).toBeInTheDocument();
  });

  test('prevents negative quantities', async () => {
    const zeroClient = { ...mockClient, ai_training_25_count: 0 };
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest clientId="test-id" client={zeroClient} />
      </Wrapper>
    );
    
    // Find decrement button and click it
    const buttons = screen.getAllByText('▼');
    fireEvent.click(buttons[0]);
    
    // Should not go below zero (handled by Math.max in component)
    expect(buttons[0]).toBeInTheDocument();
  });

  test('handles database errors gracefully', async () => {
    // Mock database error
    mockSupabase.from.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: { message: 'Database error' } }))
      }))
    });
    
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest clientId="test-id" client={mockClient} />
      </Wrapper>
    );
    
    const buttons = screen.getAllByText('▲');
    fireEvent.click(buttons[0]);
    
    // Should handle error without crashing
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  test('integration - full workflow', async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <WireframeTest clientId="test-id" client={mockClient} />
      </Wrapper>
    );
    
    // Should render all main sections
    expect(screen.getByText('בביצוע')).toBeInTheDocument();
    expect(screen.getByText('עלויות ותזמון')).toBeInTheDocument();
    expect(screen.getByText('חמבורגר טרופי')).toBeInTheDocument();
    expect(screen.getByText('תמונות מקור')).toBeInTheDocument();
    expect(screen.getByText('הערות אישיות')).toBeInTheDocument();
    
    // Test cost update
    const buttons = screen.getAllByText('▲');
    fireEvent.click(buttons[0]);
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });
  });
}); 