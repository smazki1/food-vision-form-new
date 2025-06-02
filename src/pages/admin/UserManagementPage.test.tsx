import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserManagementPage from './UserManagementPage';
import { useUserRoles } from '@/hooks/useUserRoles';
import { UserRole } from '@/types/auth';

// Mock hooks and utilities
jest.mock('@/hooks/useUserRoles');
jest.mock('@/utils/formatDate', () => ({
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString('en-US')), // Simple mock for testing
}));

// Mock sonner toast if used by useUserRoles for feedback
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAssignRoleMutate = jest.fn();
const mockRemoveRoleMutate = jest.fn();

describe('UserManagementPage', () => {
  const mockUseUserRoles = useUserRoles as jest.Mock;

  const mockUsers = [
    { id: '1', email: 'admin@example.com', created_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString(), role: 'admin' as UserRole },
    { id: '2', email: 'editor@example.com', created_at: new Date().toISOString(), email_confirmed_at: null, role: 'editor' as UserRole },
    { id: '3', email: 'user@example.com', created_at: new Date().toISOString(), email_confirmed_at: new Date().toISOString(), role: null },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserRoles.mockReturnValue({
      userRoles: { users: [], total: 0 }, // Default to empty
      isLoading: false,
      error: null,
      assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, // Added isLoading for assignRole
      removeRole: { mutate: mockRemoveRoleMutate, isLoading: false }, // Added isLoading for removeRole
    });
  });

  test('renders loading state', () => {
    mockUseUserRoles.mockReturnValue({ ...mockUseUserRoles(), isLoading: true });
    render(<UserManagementPage />);
    expect(screen.getByText('טוען נתוני משתמשים...')).toBeInTheDocument();
  });

  test('renders error state', () => {
    mockUseUserRoles.mockReturnValue({ ...mockUseUserRoles(), error: new Error('Failed to load') });
    render(<UserManagementPage />);
    expect(screen.getByText('שגיאה בטעינת משתמשים')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  test('renders page title and search input', () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: mockUsers, total: mockUsers.length }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate }, removeRole: { mutate: mockRemoveRoleMutate } });
    render(<UserManagementPage />);
    expect(screen.getByText('ניהול משתמשים')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('חיפוש לפי אימייל...')).toBeInTheDocument();
  });

  test('renders table with users', () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: mockUsers, total: mockUsers.length }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate }, removeRole: { mutate: mockRemoveRoleMutate } });
    render(<UserManagementPage />);
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.getByText('editor@example.com')).toBeInTheDocument();
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    // Check status badges
    expect(screen.getAllByText('מאומת')).toHaveLength(2);
    expect(screen.getByText('לא מאומת')).toBeInTheDocument();
  });

  test('filters users by search term', () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: mockUsers, total: mockUsers.length }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate }, removeRole: { mutate: mockRemoveRoleMutate }});
    render(<UserManagementPage />);
    fireEvent.change(screen.getByPlaceholderText('חיפוש לפי אימייל...'), { target: { value: 'admin' } });
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    expect(screen.queryByText('editor@example.com')).not.toBeInTheDocument();
  });

  test('renders empty state when no users match search', () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: mockUsers, total: mockUsers.length }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate }, removeRole: { mutate: mockRemoveRoleMutate }});
    render(<UserManagementPage />);
    fireEvent.change(screen.getByPlaceholderText('חיפוש לפי אימייל...'), { target: { value: 'nonexistent' } });
    expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
  });

  test('calls assignRole when a new role is selected', async () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: [mockUsers[2]], total: 1 }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, removeRole: { mutate: mockRemoveRoleMutate, isLoading: false } });
    render(<UserManagementPage />);

    // Find the select for the specific user
    const userRow = screen.getByText('user@example.com').closest('tr');
    const roleSelect = userRow.querySelector('button[role="combobox"]'); // ShadCN select trigger
    fireEvent.mouseDown(roleSelect);

    const adminOption = await screen.findByText('מנהל מערכת');
    fireEvent.click(adminOption);

    expect(mockAssignRoleMutate).toHaveBeenCalledWith({ userId: '3', role: 'admin' });
  });

  test('calls removeRole when "No Role" is selected', async () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: [mockUsers[0]], total: 1 }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, removeRole: { mutate: mockRemoveRoleMutate, isLoading: false } });
    render(<UserManagementPage />);
    
    const userRow = screen.getByText('admin@example.com').closest('tr');
    const roleSelect = userRow.querySelector('button[role="combobox"]');
    fireEvent.mouseDown(roleSelect);

    const noRoleOption = await screen.findByText('ללא תפקיד');
    fireEvent.click(noRoleOption);

    expect(mockRemoveRoleMutate).toHaveBeenCalledWith('1');
  });

   test('disabled user settings button is present', () => {
    mockUseUserRoles.mockReturnValue({ userRoles: { users: [mockUsers[0]], total: 1 }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate }, removeRole: { mutate: mockRemoveRoleMutate } });
    render(<UserManagementPage />);
    const settingsButton = screen.getByRole('button', { name: /הגדרות משתמש/i });
    expect(settingsButton).toBeInTheDocument();
    expect(settingsButton).toBeDisabled();
  });

  test('handles null/undefined userRoles or users list gracefully', () => {
    // Case 1: userRoles is null
    mockUseUserRoles.mockReturnValue({ userRoles: null, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, removeRole: { mutate: mockRemoveRoleMutate, isLoading: false } });
    const { rerender } = render(<UserManagementPage />);
    expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();

    // Case 2: userRoles.users is null
    mockUseUserRoles.mockReturnValue({ userRoles: { users: null, total: 0 }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, removeRole: { mutate: mockRemoveRoleMutate, isLoading: false } });
    rerender(<UserManagementPage />); 
    expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
    
    // Case 3: userRoles.users is undefined
    mockUseUserRoles.mockReturnValue({ userRoles: { users: undefined, total: 0 }, isLoading: false, error: null, assignRole: { mutate: mockAssignRoleMutate, isLoading: false }, removeRole: { mutate: mockRemoveRoleMutate, isLoading: false } });
    rerender(<UserManagementPage />); 
    expect(screen.getByText('לא נמצאו משתמשים')).toBeInTheDocument();
  });
}); 