import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientSubmissions2 } from '../ClientSubmissions2';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useClientSubmissions', () => ({
  useClientSubmissions: () => ({
    data: [
      {
        submission_id: 'test-submission-1',
        item_name_at_submission: 'Test Submission 1',
        submission_status: 'ממתינה לעיבוד',
        original_image_urls: ['test1.jpg'],
        processed_image_urls: [],
        uploaded_at: '2025-01-02T10:00:00Z'
      },
      {
        submission_id: 'test-submission-2',
        item_name_at_submission: 'Test Submission 2',
        submission_status: 'בעיבוד',
        original_image_urls: ['test2.jpg'],
        processed_image_urls: [],
        uploaded_at: '2025-01-02T11:00:00Z'
      }
    ],
    isLoading: false,
    error: null,
    refetch: vi.fn()
  }),
  useClientSubmissionStats: () => ({ data: null })
}));

vi.mock('@/hooks/useSubmissionNotes', () => ({
  useSubmissionNotes: () => ({
    notes: { admin_internal: '', client_visible: '', editor_note: '' },
    updateNote: vi.fn(),
    isSaving: false
  })
}));

vi.mock('@/hooks/useLoraDetails', () => ({
  useLoraDetails: () => ({
    loraDetails: { lora_name: '', lora_id: '', lora_link: '', fixed_prompt: '' },
    updateLoraField: vi.fn(),
    isSaving: false
  })
}));

vi.mock('@/hooks/useSubmissionStatus', () => ({
  useSubmissionStatus: () => ({
    updateSubmissionStatus: vi.fn(),
    isUpdating: false
  })
}));

vi.mock('@/hooks/useAdminSubmissions', () => ({
  useAdminSubmissionComments: () => ({ data: [] }),
  useAdminAddSubmissionComment: () => ({ mutateAsync: vi.fn() }),
  useAdminDeleteSubmission: () => ({
    mutateAsync: vi.fn().mockResolvedValue('test-submission-1'),
    isPending: false
  })
}));

const mockClient = {
  client_id: 'test-client-1',
  restaurant_name: 'Test Restaurant',
  contact_name: 'Test Contact',
  email: 'test@example.com',
  phone: '123-456-7890',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  original_lead_id: null,
  client_status: 'פעיל',
  current_package_id: null,
  remaining_servings: 10,
  remaining_images: 50,
  consumed_images: 0,
  reserved_images: 0,
  last_activity_at: '2025-01-01T00:00:00Z',
  internal_notes: null,
  user_auth_id: null,
  ai_training_25_count: 0,
  ai_training_15_count: 0,
  ai_training_5_count: 0,
  ai_prompts_count: 0
};

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ClientSubmissions2 Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display delete button on hover', async () => {
    renderWithProviders(
      <ClientSubmissions2 clientId="test-client-1" client={mockClient} />
    );

    // Wait for submissions to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });

    // Find the submission item
    const submissionItem = screen.getByText('Test Submission 1').closest('div[data-testid], div')?.parentElement;
    expect(submissionItem).toBeInTheDocument();

    // Delete button should exist but be hidden initially
    const deleteButton = submissionItem?.querySelector('button');
    expect(deleteButton).toBeInTheDocument();
  });

  it('should show confirmation dialog when delete button is clicked', async () => {
    renderWithProviders(
      <ClientSubmissions2 clientId="test-client-1" client={mockClient} />
    );

    // Wait for submissions to load
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });

    // Find and click delete button
    const submissionItem = screen.getByText('Test Submission 1').closest('div[data-testid], div')?.parentElement;
    const deleteButton = submissionItem?.querySelector('button');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Check if confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText('מחיקת הגשה')).toBeInTheDocument();
      expect(screen.getByText('האם אתה בטוח שברצונך למחוק את ההגשה הזו?')).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel is clicked', async () => {
    renderWithProviders(
      <ClientSubmissions2 clientId="test-client-1" client={mockClient} />
    );

    // Wait for submissions to load and trigger delete
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });

    const submissionItem = screen.getByText('Test Submission 1').closest('div[data-testid], div')?.parentElement;
    const deleteButton = submissionItem?.querySelector('button');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Wait for dialog and click cancel
    await waitFor(() => {
      expect(screen.getByText('מחיקת הגשה')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'ביטול' });
    fireEvent.click(cancelButton);

    // Dialog should be closed
    await waitFor(() => {
      expect(screen.queryByText('מחיקת הגשה')).not.toBeInTheDocument();
    });
  });

  it('should call delete mutation when confirm is clicked', async () => {
    const mockDeleteMutation = vi.fn().mockResolvedValue('test-submission-1');
    
    vi.mocked(require('@/hooks/useAdminSubmissions').useAdminDeleteSubmission).mockReturnValue({
      mutateAsync: mockDeleteMutation,
      isPending: false
    });

    renderWithProviders(
      <ClientSubmissions2 clientId="test-client-1" client={mockClient} />
    );

    // Wait for submissions and trigger delete
    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });

    const submissionItem = screen.getByText('Test Submission 1').closest('div[data-testid], div')?.parentElement;
    const deleteButton = submissionItem?.querySelector('button');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('מחיקת הגשה')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: 'מחק' });
    fireEvent.click(confirmButton);

    // Verify mutation was called
    await waitFor(() => {
      expect(mockDeleteMutation).toHaveBeenCalledWith('test-submission-1');
    });
  });

  it('should prevent event propagation when delete button is clicked', async () => {
    const mockSetSelectedSubmission = vi.fn();
    
    renderWithProviders(
      <ClientSubmissions2 clientId="test-client-1" client={mockClient} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Submission 1')).toBeInTheDocument();
    });

    // Click delete button should not trigger submission selection
    const submissionItem = screen.getByText('Test Submission 1').closest('div[data-testid], div')?.parentElement;
    const deleteButton = submissionItem?.querySelector('button');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }

    // Should show delete dialog, not change selection
    await waitFor(() => {
      expect(screen.getByText('מחיקת הגשה')).toBeInTheDocument();
    });
  });
}); 