import { render, screen, fireEvent } from '@testing-library/react';
import SubmissionsQueuePage from './SubmissionsQueuePage';
import { useUnassignedSubmissions } from '@/hooks/useUnassignedSubmissions';
import { useAllEditors } from '@/hooks/useAllEditors';

// Mock hooks
jest.mock('@/hooks/useUnassignedSubmissions');
jest.mock('@/hooks/useAllEditors');
jest.mock('@/components/admin/submissions-queue/SubmissionsQueueTable', () => ({
  SubmissionsQueueTable: jest.fn(({ submissions, loading }) => (
    <div data-testid="mock-submissions-table">
      {loading && <p>Loading table...</p>}
      {submissions.length === 0 && !loading && <p>No submissions in table</p>}
      {submissions.map(s => <div key={s.submission_id}>{s.item_name_at_submission}</div>)}
    </div>
  )),
}));
// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));


describe('SubmissionsQueuePage', () => {
  const mockUseUnassignedSubmissions = useUnassignedSubmissions as jest.Mock;
  const mockUseAllEditors = useAllEditors as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    mockUseUnassignedSubmissions.mockReturnValue({
      submissions: [],
      loading: false,
      refreshSubmissions: jest.fn(),
    });
    mockUseAllEditors.mockReturnValue({ 
        editors: [{ id: 'editor1', name: 'Editor Avi', email: 'avi@test.com', tasksCount: 2 }],
        isLoading: false, // Corrected: useAllEditors returns isLoading, not isLoadingEditors
    });
  });

  test('renders loading state initially', () => {
    mockUseUnassignedSubmissions.mockReturnValue({
      submissions: [],
      loading: true,
      refreshSubmissions: jest.fn(),
    });
    render(<SubmissionsQueuePage />);
    expect(screen.getByTestId('mock-submissions-table')).toHaveTextContent('Loading table...');
  });

  test('renders empty state when no submissions', () => {
    render(<SubmissionsQueuePage />);
    expect(screen.getByText('תור הגשות לטיפול')).toBeInTheDocument();
    expect(screen.getByTestId('mock-submissions-table')).toHaveTextContent('No submissions in table');
    const totalSubmissionsCardTitle = screen.getByText('הגשות בתור');
    const totalSubmissionsCard = totalSubmissionsCardTitle.closest('div.pb-2')?.nextElementSibling;
    expect(totalSubmissionsCard).toHaveTextContent('0');
  });

  test('handles null or undefined submissions gracefully', () => {
    mockUseUnassignedSubmissions.mockReturnValue({
      submissions: null, // Test with null
      loading: false,
      refreshSubmissions: jest.fn(),
    });
    render(<SubmissionsQueuePage />);    
    expect(screen.getByText('תור הגשות לטיפול')).toBeInTheDocument();
    expect(screen.getByTestId('mock-submissions-table')).toHaveTextContent('No submissions in table');
    const totalSubmissionsCardTitle = screen.getByText('הגשות בתור');
    const totalSubmissionsCard = totalSubmissionsCardTitle.closest('div.pb-2')?.nextElementSibling;
    expect(totalSubmissionsCard).toHaveTextContent('0'); // Should show 0 and not crash

    // Test with undefined
    mockUseUnassignedSubmissions.mockReturnValue({
        submissions: undefined,
        loading: false,
        refreshSubmissions: jest.fn(),
      });
    render(<SubmissionsQueuePage />); // Re-render with new mock value
    expect(screen.getByTestId('mock-submissions-table')).toHaveTextContent('No submissions in table');
    expect(totalSubmissionsCard).toHaveTextContent('0');
  });

  test('renders submissions and stats correctly', () => {
    const mockSubmissions = [
      { submission_id: '1', item_name_at_submission: 'Pizza', priority: 'High', uploaded_at: new Date().toISOString(), clients: { restaurant_name: 'Pizza Place' } },
      { submission_id: '2', item_name_at_submission: 'Burger', priority: 'Medium', uploaded_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), clients: { restaurant_name: 'Burger Joint' } },
    ];
    mockUseUnassignedSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      loading: false,
      refreshSubmissions: jest.fn(),
    });
    render(<SubmissionsQueuePage />);
    expect(screen.getByText('Pizza')).toBeInTheDocument();
    expect(screen.getByText('Burger')).toBeInTheDocument();
    
    const totalSubmissionsCardTitle = screen.getByText('הגשות בתור');
    const totalSubmissionsCard = totalSubmissionsCardTitle.closest('div.pb-2')?.nextElementSibling;
    expect(totalSubmissionsCard).toHaveTextContent('2');

    const highPriorityCardTitle = screen.getByText('עדיפות גבוהה');
    const highPriorityCard = highPriorityCardTitle.closest('div.pb-2')?.nextElementSibling;
    expect(highPriorityCard).toHaveTextContent('1');
    
    const urgentSubmissionsCardTitle = screen.getByText('הגשות דחופות');
    const urgentSubmissionsCard = urgentSubmissionsCardTitle.closest('div.pb-2')?.nextElementSibling;
    expect(urgentSubmissionsCard).toHaveTextContent('1');
  });

  test('filters submissions by priority', async () => {
    const mockSubmissions = [
      { submission_id: '1', item_name_at_submission: 'Pizza', priority: 'High', uploaded_at: new Date().toISOString(), clients: { restaurant_name: 'Pizza Place' } },
      { submission_id: '2', item_name_at_submission: 'Burger', priority: 'Medium', uploaded_at: new Date().toISOString(), clients: { restaurant_name: 'Burger Joint' } },
    ];
     mockUseUnassignedSubmissions.mockReturnValue({
      submissions: mockSubmissions,
      loading: false,
      refreshSubmissions: jest.fn(),
    });
    render(<SubmissionsQueuePage />);
    
    const priorityFilterSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(priorityFilterSelect);
    
    const highPriorityOption = await screen.findByText('High');
    fireEvent.click(highPriorityOption);

    expect(priorityFilterSelect).toHaveTextContent('High');
  });

  test('calls refreshSubmissions on button click', () => {
    const refreshFn = jest.fn();
    mockUseUnassignedSubmissions.mockReturnValue({
      submissions: [],
      loading: false,
      refreshSubmissions: refreshFn,
    });
    render(<SubmissionsQueuePage />);
    fireEvent.click(screen.getByRole('button', { name: /Refresh submissions/i }));
    expect(refreshFn).toHaveBeenCalledTimes(1);
  });
}); 