import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PackageActions from '../PackageActions';
import { Package } from '@/types/package';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/api/packageApi', () => ({
  deletePackage: vi.fn(),
}));

const mockPackage: Package = {
  package_id: 'test-package-id',
  package_name: 'Test Package',
  description: 'Test Description',
  total_servings: 10,
  price: 100,
  is_active: true,
  max_processing_time_days: 5,
  max_edits_per_serving: 2,
  special_notes: 'Test notes',
  total_images: 20,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('PackageActions', () => {
  const mockOnEditClick = vi.fn();
  const mockOnDeleteClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render edit and delete buttons', () => {
    renderWithQueryClient(
      <PackageActions
        pkg={mockPackage}
        onEditClick={mockOnEditClick}
        onDeleteClick={mockOnDeleteClick}
        isDeleting={false}
      />
    );

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit package/i }));
    expect(mockOnEdit).toHaveBeenCalledWith(mockPackage);
  });

  it('should show confirmation dialog when delete button is clicked', () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /delete package/i }));
    
    expect(screen.getByText('מחיקת חבילה')).toBeInTheDocument();
    expect(screen.getByText(/האם אתה בטוח שברצונך למחוק את החבילה/)).toBeInTheDocument();
  });

  it('should call onDelete when delete is confirmed', async () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Open delete dialog
    fireEvent.click(screen.getByRole('button', { name: /delete package/i }));
    
    // Confirm deletion
    fireEvent.click(screen.getByRole('button', { name: /מחק חבילה/i }));
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockPackage);
  });

  it('should close dialog when cancel is clicked', () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={false}
      />
    );

    // Open delete dialog
    fireEvent.click(screen.getByRole('button', { name: /delete package/i }));
    
    // Cancel deletion
    fireEvent.click(screen.getByRole('button', { name: /ביטול/i }));
    
    expect(screen.queryByText('מחיקת חבילה')).not.toBeInTheDocument();
  });

  it('should show loading state when deleting', () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete package/i });
    expect(deleteButton).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should disable buttons when deleting', () => {
    renderWithQueryClient(
      <PackageActions
        package={mockPackage}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    );

    expect(screen.getByRole('button', { name: /edit package/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete package/i })).toBeDisabled();
  });
}); 