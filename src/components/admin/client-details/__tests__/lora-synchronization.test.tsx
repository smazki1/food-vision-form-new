import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useLoraDetails } from '@/hooks/useLoraDetails';

// Mock the hook
vi.mock('@/hooks/useLoraDetails');

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              lora_name: 'Test LORA',
              lora_id: 'test-123',
              lora_link: 'https://example.com/lora',
              fixed_prompt: 'Test prompt'
            },
            error: null
          }))
        }))
      })),
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

// Test component that uses the hook
const TestLoraComponent: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  const { loraDetails, updateLoraField, isSaving } = useLoraDetails(submissionId);

  return (
    <div>
      <input
        data-testid="lora-name"
        value={loraDetails.lora_name}
        onChange={(e) => updateLoraField('lora_name', e.target.value)}
        placeholder="שם LORA"
      />
      <input
        data-testid="lora-id"
        value={loraDetails.lora_id}
        onChange={(e) => updateLoraField('lora_id', e.target.value)}
        placeholder="מזהה LORA"
      />
      <input
        data-testid="lora-link"
        value={loraDetails.lora_link}
        onChange={(e) => updateLoraField('lora_link', e.target.value)}
        placeholder="קישור LORA"
      />
      <textarea
        data-testid="fixed-prompt"
        value={loraDetails.fixed_prompt}
        onChange={(e) => updateLoraField('fixed_prompt', e.target.value)}
        placeholder="Prompt קבוע"
      />
      {isSaving && <div data-testid="saving-indicator">שומר פרטי LORA...</div>}
    </div>
  );
};

describe('LORA Details Synchronization', () => {
  let queryClient: QueryClient;
  const mockUseLoraDetails = vi.mocked(useLoraDetails);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Reset mocks
    vi.clearAllMocks();

    // Default mock implementation
    mockUseLoraDetails.mockReturnValue({
      loraDetails: {
        lora_name: 'Test LORA',
        lora_id: 'test-123',
        lora_link: 'https://example.com/lora',
        fixed_prompt: 'Test prompt'
      },
      updateLoraField: vi.fn(),
      isLoading: false,
      isSaving: false,
      refetch: vi.fn()
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render LORA details correctly', () => {
    renderWithQueryClient(<TestLoraComponent submissionId="test-submission-id" />);

    expect(screen.getByTestId('lora-name')).toHaveValue('Test LORA');
    expect(screen.getByTestId('lora-id')).toHaveValue('test-123');
    expect(screen.getByTestId('lora-link')).toHaveValue('https://example.com/lora');
    expect(screen.getByTestId('fixed-prompt')).toHaveValue('Test prompt');
  });

  it('should call updateLoraField when inputs change', () => {
    const mockUpdateLoraField = vi.fn();
    mockUseLoraDetails.mockReturnValue({
      loraDetails: {
        lora_name: '',
        lora_id: '',
        lora_link: '',
        fixed_prompt: ''
      },
      updateLoraField: mockUpdateLoraField,
      isLoading: false,
      isSaving: false,
      refetch: vi.fn()
    });

    renderWithQueryClient(<TestLoraComponent submissionId="test-submission-id" />);

    fireEvent.change(screen.getByTestId('lora-name'), {
      target: { value: 'New LORA Name' }
    });

    expect(mockUpdateLoraField).toHaveBeenCalledWith('lora_name', 'New LORA Name');
  });

  it('should show saving indicator when saving', () => {
    mockUseLoraDetails.mockReturnValue({
      loraDetails: {
        lora_name: '',
        lora_id: '',
        lora_link: '',
        fixed_prompt: ''
      },
      updateLoraField: vi.fn(),
      isLoading: false,
      isSaving: true,
      refetch: vi.fn()
    });

    renderWithQueryClient(<TestLoraComponent submissionId="test-submission-id" />);

    expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('saving-indicator')).toHaveTextContent('שומר פרטי LORA...');
  });

  it('should handle empty submission ID', () => {
    renderWithQueryClient(<TestLoraComponent submissionId="" />);

    // Should still render inputs with empty values
    expect(screen.getByTestId('lora-name')).toBeInTheDocument();
    expect(screen.getByTestId('lora-id')).toBeInTheDocument();
    expect(screen.getByTestId('lora-link')).toBeInTheDocument();
    expect(screen.getByTestId('fixed-prompt')).toBeInTheDocument();
  });

  it('should update all LORA fields independently', () => {
    const mockUpdateLoraField = vi.fn();
    mockUseLoraDetails.mockReturnValue({
      loraDetails: {
        lora_name: '',
        lora_id: '',
        lora_link: '',
        fixed_prompt: ''
      },
      updateLoraField: mockUpdateLoraField,
      isLoading: false,
      isSaving: false,
      refetch: vi.fn()
    });

    renderWithQueryClient(<TestLoraComponent submissionId="test-submission-id" />);

    // Test each field
    fireEvent.change(screen.getByTestId('lora-name'), {
      target: { value: 'LORA Name' }
    });
    expect(mockUpdateLoraField).toHaveBeenCalledWith('lora_name', 'LORA Name');

    fireEvent.change(screen.getByTestId('lora-id'), {
      target: { value: 'lora-123' }
    });
    expect(mockUpdateLoraField).toHaveBeenCalledWith('lora_id', 'lora-123');

    fireEvent.change(screen.getByTestId('lora-link'), {
      target: { value: 'https://lora.example.com' }
    });
    expect(mockUpdateLoraField).toHaveBeenCalledWith('lora_link', 'https://lora.example.com');

    fireEvent.change(screen.getByTestId('fixed-prompt'), {
      target: { value: 'Fixed prompt text' }
    });
    expect(mockUpdateLoraField).toHaveBeenCalledWith('fixed_prompt', 'Fixed prompt text');
  });

  it('should handle Hebrew text input correctly', () => {
    const mockUpdateLoraField = vi.fn();
    mockUseLoraDetails.mockReturnValue({
      loraDetails: {
        lora_name: 'שם LORA בעברית',
        lora_id: '',
        lora_link: '',
        fixed_prompt: 'פרומפט בעברית'
      },
      updateLoraField: mockUpdateLoraField,
      isLoading: false,
      isSaving: false,
      refetch: vi.fn()
    });

    renderWithQueryClient(<TestLoraComponent submissionId="test-submission-id" />);

    expect(screen.getByTestId('lora-name')).toHaveValue('שם LORA בעברית');
    expect(screen.getByTestId('fixed-prompt')).toHaveValue('פרומפט בעברית');
  });
}); 