import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useSubmissionNotes } from '@/hooks/useSubmissionNotes';

// Mock the hook
vi.mock('@/hooks/useSubmissionNotes');

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              single: vi.fn(),
              limit: vi.fn()
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          error: null
        }))
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

// Test component that uses the hook
const TestNotesComponent: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  const { notes, updateNote, isSaving } = useSubmissionNotes(submissionId);

  return (
    <div>
      <div data-testid="admin-note">
        <textarea
          data-testid="admin-note-input"
          value={notes.admin_internal}
          onChange={(e) => updateNote('admin_internal', e.target.value)}
          placeholder="הערה לעצמי"
          disabled={isSaving}
        />
      </div>
      <div data-testid="client-note">
        <textarea
          data-testid="client-note-input"
          value={notes.client_visible}
          onChange={(e) => updateNote('client_visible', e.target.value)}
          placeholder="הערה ללקוח"
          disabled={isSaving}
        />
      </div>
      <div data-testid="editor-note">
        <textarea
          data-testid="editor-note-input"
          value={notes.editor_note}
          onChange={(e) => updateNote('editor_note', e.target.value)}
          placeholder="הערה לעורך"
          disabled={isSaving}
        />
      </div>
      {isSaving && <div data-testid="saving-indicator">שומר...</div>}
    </div>
  );
};

describe('Notes Synchronization', () => {
  let queryClient: QueryClient;
  const mockUseSubmissionNotes = vi.mocked(useSubmissionNotes);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Reset mock
    mockUseSubmissionNotes.mockReturnValue({
      notes: {
        admin_internal: '',
        client_visible: '',
        editor_note: ''
      },
      isLoading: false,
      isSaving: false,
      updateNote: vi.fn(),
      saveNote: vi.fn(),
      fetchNotes: vi.fn()
    });
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render all three note types', () => {
    renderWithProvider(<TestNotesComponent submissionId="test-submission-id" />);

    expect(screen.getByTestId('admin-note-input')).toBeInTheDocument();
    expect(screen.getByTestId('client-note-input')).toBeInTheDocument();
    expect(screen.getByTestId('editor-note-input')).toBeInTheDocument();
  });

  it('should display existing notes from the hook', () => {
    const mockNotes = {
      admin_internal: 'הערה פנימית',
      client_visible: 'הערה ללקוח',
      editor_note: 'הערה לעורך'
    };

    mockUseSubmissionNotes.mockReturnValue({
      notes: mockNotes,
      isLoading: false,
      isSaving: false,
      updateNote: vi.fn(),
      saveNote: vi.fn(),
      fetchNotes: vi.fn()
    });

    renderWithProvider(<TestNotesComponent submissionId="test-submission-id" />);

    expect(screen.getByDisplayValue('הערה פנימית')).toBeInTheDocument();
    expect(screen.getByDisplayValue('הערה ללקוח')).toBeInTheDocument();
    expect(screen.getByDisplayValue('הערה לעורך')).toBeInTheDocument();
  });

  it('should call updateNote when text changes', () => {
    const mockUpdateNote = vi.fn();
    
    mockUseSubmissionNotes.mockReturnValue({
      notes: {
        admin_internal: '',
        client_visible: '',
        editor_note: ''
      },
      isLoading: false,
      isSaving: false,
      updateNote: mockUpdateNote,
      saveNote: vi.fn(),
      fetchNotes: vi.fn()
    });

    renderWithProvider(<TestNotesComponent submissionId="test-submission-id" />);

    const adminInput = screen.getByTestId('admin-note-input');
    fireEvent.change(adminInput, { target: { value: 'הערה חדשה' } });

    expect(mockUpdateNote).toHaveBeenCalledWith('admin_internal', 'הערה חדשה');
  });

  it('should disable inputs when saving', () => {
    mockUseSubmissionNotes.mockReturnValue({
      notes: {
        admin_internal: '',
        client_visible: '',
        editor_note: ''
      },
      isLoading: false,
      isSaving: true,
      updateNote: vi.fn(),
      saveNote: vi.fn(),
      fetchNotes: vi.fn()
    });

    renderWithProvider(<TestNotesComponent submissionId="test-submission-id" />);

    expect(screen.getByTestId('admin-note-input')).toBeDisabled();
    expect(screen.getByTestId('client-note-input')).toBeDisabled();
    expect(screen.getByTestId('editor-note-input')).toBeDisabled();
    expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
  });

  it('should handle different submission IDs', () => {
    const { rerender } = renderWithProvider(<TestNotesComponent submissionId="submission-1" />);

    expect(mockUseSubmissionNotes).toHaveBeenCalledWith('submission-1');

    rerender(
      <QueryClientProvider client={queryClient}>
        <TestNotesComponent submissionId="submission-2" />
      </QueryClientProvider>
    );

    expect(mockUseSubmissionNotes).toHaveBeenCalledWith('submission-2');
  });

  it('should handle null submission ID', () => {
    renderWithProvider(<TestNotesComponent submissionId={null as any} />);

    expect(mockUseSubmissionNotes).toHaveBeenCalledWith(null);
  });
}); 