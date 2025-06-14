import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSubmissionStatus, SUBMISSION_STATUSES } from '@/hooks/useSubmissionStatus';

// Mock the hook
vi.mock('@/hooks/useSubmissionStatus');

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Test component that uses the status hook
const TestStatusComponent: React.FC<{ submissionId: string; currentStatus: string }> = ({ 
  submissionId, 
  currentStatus 
}) => {
  const { updateSubmissionStatus, isUpdating, availableStatuses } = useSubmissionStatus();

  const handleStatusChange = async (newStatus: string) => {
    await updateSubmissionStatus(submissionId, newStatus as any);
  };

  return (
    <div>
      <div data-testid="current-status">{currentStatus}</div>
      <select 
        data-testid="status-selector"
        value={currentStatus}
        onChange={(e) => handleStatusChange(e.target.value)}
        disabled={isUpdating}
      >
        {availableStatuses.map(status => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
      {isUpdating && <div data-testid="updating-indicator">שומר...</div>}
    </div>
  );
};

describe('Submission Status Change', () => {
  let queryClient: QueryClient;
  let mockUpdateSubmissionStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    mockUpdateSubmissionStatus = vi.fn().mockResolvedValue(true);

    (useSubmissionStatus as any).mockReturnValue({
      updateSubmissionStatus: mockUpdateSubmissionStatus,
      isUpdating: false,
      availableStatuses: SUBMISSION_STATUSES
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('renders status selector with current status', () => {
    renderWithProviders(
      <TestStatusComponent 
        submissionId="test-123" 
        currentStatus="בעיבוד" 
      />
    );

    expect(screen.getByTestId('current-status')).toHaveTextContent('בעיבוד');
    const selector = screen.getByTestId('status-selector') as HTMLSelectElement;
    expect(selector.value).toBe('בעיבוד');
  });

  it('displays all available statuses in selector', () => {
    renderWithProviders(
      <TestStatusComponent 
        submissionId="test-123" 
        currentStatus="בעיבוד" 
      />
    );

    const selector = screen.getByTestId('status-selector');
    const options = Array.from(selector.querySelectorAll('option'));
    
    expect(options).toHaveLength(SUBMISSION_STATUSES.length);
    SUBMISSION_STATUSES.forEach((status, index) => {
      expect(options[index]).toHaveTextContent(status);
    });
  });

  it('calls updateSubmissionStatus when status is changed', async () => {
    renderWithProviders(
      <TestStatusComponent 
        submissionId="test-123" 
        currentStatus="בעיבוד" 
      />
    );

    const selector = screen.getByTestId('status-selector');
    fireEvent.change(selector, { target: { value: 'הושלמה ואושרה' } });

    await waitFor(() => {
      expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith('test-123', 'הושלמה ואושרה');
    }, { timeout: 3000 });
  });

  it('shows loading indicator when updating', () => {
    (useSubmissionStatus as any).mockReturnValue({
      updateSubmissionStatus: mockUpdateSubmissionStatus,
      isUpdating: true,
      availableStatuses: SUBMISSION_STATUSES
    });

    renderWithProviders(
      <TestStatusComponent 
        submissionId="test-123" 
        currentStatus="בעיבוד" 
      />
    );

    expect(screen.getByTestId('updating-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('status-selector')).toBeDisabled();
  });

  it('handles status change with proper Hebrew statuses', async () => {
    renderWithProviders(
      <TestStatusComponent 
        submissionId="test-123" 
        currentStatus="ממתינה לעיבוד" 
      />
    );

    const selector = screen.getByTestId('status-selector');
    
    // Test changing to each status
    for (const status of SUBMISSION_STATUSES) {
      fireEvent.change(selector, { target: { value: status } });
      
      await waitFor(() => {
        expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith('test-123', status);
      });
    }
  });

  it('handles empty submission ID gracefully', async () => {
    renderWithProviders(
      <TestStatusComponent 
        submissionId="" 
        currentStatus="בעיבוד" 
      />
    );

    const selector = screen.getByTestId('status-selector');
    fireEvent.change(selector, { target: { value: 'הושלמה ואושרה' } });

    await waitFor(() => {
      expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith('', 'הושלמה ואושרה');
    }, { timeout: 3000 });
  });
}); 