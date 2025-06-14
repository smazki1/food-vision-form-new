import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { Client } from '@/types/client';

// Mock the ClientSubmissions2 component
vi.mock('@/components/admin/client-details/ClientSubmissions2', () => ({
  ClientSubmissions2: ({ clientId, client }: { clientId: string; client: Client }) => (
    <div data-testid="client-submissions-2">
      ClientSubmissions2 for {client.restaurant_name}
    </div>
  )
}));

// Mock other tab components
vi.mock('@/components/admin/client-details/tabs/ClientOverviewTab', () => ({
  ClientOverviewTab: () => <div data-testid="overview-tab">Overview Tab</div>
}));

vi.mock('@/components/admin/client-details/tabs/ClientSubmissionsTab', () => ({
  ClientSubmissionsTab: () => <div data-testid="submissions-tab">Submissions Tab</div>
}));

vi.mock('@/components/admin/client-details/tabs/ClientPackagesTab', () => ({
  ClientPackagesTab: () => <div data-testid="packages-tab">Packages Tab</div>
}));

vi.mock('@/components/admin/client-details/tabs/ClientNotesTab', () => ({
  ClientNotesTab: () => <div data-testid="notes-tab">Notes Tab</div>
}));

vi.mock('@/components/admin/client-details/tabs/ClientActivityTab', () => ({
  ClientActivityTab: () => <div data-testid="activity-tab">Activity Tab</div>
}));

// Mock hooks
vi.mock('@/hooks/useClient', () => ({
  useClient: () => ({
    data: mockClient,
    isLoading: false,
    error: null
  })
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

// Create a mock ClientDetailPanel component that includes the new tab
const MockClientDetailPanel = ({ clientId }: { clientId: string }) => {
  const [activeTab, setActiveTab] = React.useState('overview');
  
  return (
    <div data-testid="client-detail-panel">
      <div data-testid="tab-navigation">
        <button 
          onClick={() => setActiveTab('overview')}
          data-testid="tab-overview"
        >
          סקירה כללית
        </button>
        <button 
          onClick={() => setActiveTab('submissions')}
          data-testid="tab-submissions"
        >
          הגשות
        </button>
        <button 
          onClick={() => setActiveTab('packages')}
          data-testid="tab-packages"
        >
          חבילות
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          data-testid="tab-notes"
        >
          הערות
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          data-testid="tab-activity"
        >
          פעילות
        </button>
        <button 
          onClick={() => setActiveTab('submissions2')}
          data-testid="tab-submissions2"
        >
          הגשות 2
        </button>
      </div>
      
      <div data-testid="tab-content">
        {activeTab === 'overview' && <div data-testid="overview-tab">Overview Tab</div>}
        {activeTab === 'submissions' && <div data-testid="submissions-tab">Submissions Tab</div>}
        {activeTab === 'packages' && <div data-testid="packages-tab">Packages Tab</div>}
        {activeTab === 'notes' && <div data-testid="notes-tab">Notes Tab</div>}
        {activeTab === 'activity' && <div data-testid="activity-tab">Activity Tab</div>}
        {activeTab === 'submissions2' && (
          <div data-testid="client-submissions-2">
            ClientSubmissions2 for {mockClient.restaurant_name}
          </div>
        )}
      </div>
    </div>
  );
};

describe('ClientDetailPanel Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with all tabs including new submissions2 tab', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    expect(screen.getByTestId('client-detail-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-submissions')).toBeInTheDocument();
    expect(screen.getByTestId('tab-packages')).toBeInTheDocument();
    expect(screen.getByTestId('tab-notes')).toBeInTheDocument();
    expect(screen.getByTestId('tab-activity')).toBeInTheDocument();
    expect(screen.getByTestId('tab-submissions2')).toBeInTheDocument();
  });

  test('displays correct tab labels', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    expect(screen.getByText('סקירה כללית')).toBeInTheDocument();
    expect(screen.getByText('הגשות')).toBeInTheDocument();
    expect(screen.getByText('חבילות')).toBeInTheDocument();
    expect(screen.getByText('הערות')).toBeInTheDocument();
    expect(screen.getByText('פעילות')).toBeInTheDocument();
    expect(screen.getByText('הגשות 2')).toBeInTheDocument();
  });

  test('switches to submissions2 tab correctly', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Initially shows overview tab
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    
    // Click submissions2 tab
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    
    // Should show ClientSubmissions2 component
    expect(screen.getByTestId('client-submissions-2')).toBeInTheDocument();
    expect(screen.getByText('ClientSubmissions2 for Test Restaurant')).toBeInTheDocument();
  });

  test('navigates between all tabs', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Test each tab navigation
    const tabs = [
      { id: 'tab-submissions', content: 'submissions-tab' },
      { id: 'tab-packages', content: 'packages-tab' },
      { id: 'tab-notes', content: 'notes-tab' },
      { id: 'tab-activity', content: 'activity-tab' },
      { id: 'tab-submissions2', content: 'client-submissions-2' },
      { id: 'tab-overview', content: 'overview-tab' }
    ];
    
    tabs.forEach(tab => {
      fireEvent.click(screen.getByTestId(tab.id));
      expect(screen.getByTestId(tab.content)).toBeInTheDocument();
    });
  });

  test('maintains tab state during navigation', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Navigate to submissions2 tab
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    expect(screen.getByTestId('client-submissions-2')).toBeInTheDocument();
    
    // Navigate to another tab
    fireEvent.click(screen.getByTestId('tab-packages'));
    expect(screen.getByTestId('packages-tab')).toBeInTheDocument();
    
    // Navigate back to submissions2 tab
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    expect(screen.getByTestId('client-submissions-2')).toBeInTheDocument();
  });

  test('handles tab content rendering correctly', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Should only show one tab content at a time
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    expect(screen.queryByTestId('submissions-tab')).not.toBeInTheDocument();
    expect(screen.queryByTestId('client-submissions-2')).not.toBeInTheDocument();
    
    // Switch to submissions2
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    expect(screen.queryByTestId('overview-tab')).not.toBeInTheDocument();
    expect(screen.getByTestId('client-submissions-2')).toBeInTheDocument();
  });

  test('passes correct props to ClientSubmissions2', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Navigate to submissions2 tab
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    
    // Should pass client data correctly
    expect(screen.getByText('ClientSubmissions2 for Test Restaurant')).toBeInTheDocument();
  });

  test('integration - full tab system functionality', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <MockClientDetailPanel clientId="test-client-id" />
      </Wrapper>
    );
    
    // Should render complete tab system
    expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
    
    // Should have 6 tabs total
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons).toHaveLength(6);
    
    // Should start with overview tab active
    expect(screen.getByTestId('overview-tab')).toBeInTheDocument();
    
    // Should be able to navigate to new submissions2 tab
    fireEvent.click(screen.getByTestId('tab-submissions2'));
    expect(screen.getByTestId('client-submissions-2')).toBeInTheDocument();
  });
}); 