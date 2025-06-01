import { render, screen, fireEvent } from '@testing-library/react';
import AlertsDashboard from './AlertsDashboard';
import { useAlerts } from '@/hooks/useAlerts';
import { AlertType, Alert, NewLeadAlert, ReminderDueAlert, LowServingsAlert, BaseAlert } from '@/types/alert';

// Mock hooks and child components
jest.mock('@/hooks/useAlerts');
jest.mock('@/components/admin/alerts/AlertsList', () => ({
  AlertsList: jest.fn(({ alerts, onMarkAllViewed }) => (
    <div data-testid="alerts-list">
      {alerts.map((alert: Alert) => <div key={alert.id}>{alert.message || alert.type}</div>)}
      <button onClick={onMarkAllViewed}>Mark All Viewed</button>
    </div>
  )),
}));
jest.mock('@/components/admin/alerts/RemindersSchedule', () => ({
  RemindersSchedule: jest.fn(({ reminders }) => (
    <div data-testid="reminders-schedule">
      {reminders.map((reminder: any) => <div key={reminder.id}>{reminder.title || reminder.id}</div>)}
    </div>
  )),
}));
jest.mock('@/components/admin/client-details/PlaceholderCard', () => ({
    PlaceholderCard: jest.fn(({ title }) => <div data-testid="placeholder-card">{title}</div>)
}));

const mockMarkAllAsViewed = jest.fn();
const mockMarkAsViewed = jest.fn();
const mockDismissAlert = jest.fn();

describe('AlertsDashboard Page', () => {
  const mockUseAlerts = useAlerts as jest.Mock;

  const sampleAlerts: Alert[] = [
    { 
      id: '1', type: 'new-lead', leadId: 'lead1', restaurantName: 'Pizza Place', 
      message: 'New lead from Pizza Place', 
      timestamp: new Date(Date.now() - 10000).toISOString(), 
      viewed: false, data: {},
      severity: 'high', status: 'new'
    } as NewLeadAlert,
    { 
      id: '2', type: 'reminder-due', leadId: 'lead2', contactName: 'John Doe', reminderDetails: 'Call back',
      message: 'Reminder for John Doe', 
      timestamp: new Date().toISOString(), 
      viewed: true, data: {},
      severity: 'medium', status: 'viewed'
    } as ReminderDueAlert,
    { 
      id: '3', type: 'low-servings', clientId: 'client1', restaurantName: 'Burger Joint', remainingServings: 2,
      message: 'Low servings at Burger Joint', 
      timestamp: new Date(Date.now() - 20000).toISOString(), 
      viewed: false, data: {},
      severity: 'low', status: 'new'
    } as LowServingsAlert,
  ];
  const sampleReminders = [{ id: 'r1', title: 'Follow up lead A' }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAlerts.mockReturnValue({
      alerts: sampleAlerts,
      allAlertsCount: sampleAlerts.length,
      filteredAlertsCount: sampleAlerts.length,
      upcomingReminders: sampleReminders,
      markAsViewed: mockMarkAsViewed,
      dismissAlert: mockDismissAlert,
      markAllAsViewed: mockMarkAllAsViewed,
    });
  });

  test('renders page title and filter buttons', () => {
    render(<AlertsDashboard />);
    expect(screen.getByText('דאשבורד התראות')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /הכל/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /לידים חדשים/ })).toBeInTheDocument();
  });

  test('renders AlertsList and RemindersSchedule with data', () => {
    render(<AlertsDashboard />);
    expect(screen.getByTestId('alerts-list')).toBeInTheDocument();
    expect(screen.getByText('New lead from Pizza Place')).toBeInTheDocument();
    expect(screen.getByTestId('reminders-schedule')).toBeInTheDocument();
    expect(screen.getByText('Follow up lead A')).toBeInTheDocument();
    expect(mockUseAlerts).toHaveBeenCalledWith({ typeFilter: 'new-lead' });
  });

  test('filters alerts when a filter button is clicked', () => {
    render(<AlertsDashboard />);
    fireEvent.click(screen.getByRole('button', { name: /לידים חדשים/ }));
    expect(mockUseAlerts).toHaveBeenCalledWith({ typeFilter: 'new-lead' });
  });

  test('sorts alerts when sort order is changed', async () => {
    render(<AlertsDashboard />);
    const sortSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(sortSelect);
    const oldestOption = await screen.findByText('הישן ביותר');
    fireEvent.click(oldestOption);
    
    const alertsList = screen.getByTestId('alerts-list');
    const alertElements = Array.from(alertsList.childNodes).filter(node => node.nodeName === 'DIV');
    expect(alertElements[0]).toHaveTextContent('Low servings at Burger Joint');
    expect(alertElements[1]).toHaveTextContent('New lead from Pizza Place');
    expect(alertElements[2]).toHaveTextContent('Reminder for John Doe');
  });

  test('shows placeholder when no alerts match filter', () => {
    mockUseAlerts.mockReturnValue({
      ...mockUseAlerts(),
      alerts: [],
      filteredAlertsCount: 0,
    });
    render(<AlertsDashboard />);
    expect(screen.getByTestId('placeholder-card')).toBeInTheDocument();
    expect(screen.getByText('אין התראות')).toBeInTheDocument();
  });
  
  test('calls markAllAsViewed from AlertsList', () => {
    render(<AlertsDashboard />);
    fireEvent.click(screen.getByRole('button', {name: 'Mark All Viewed'}));
    expect(mockMarkAllAsViewed).toHaveBeenCalled();
  });

  test('handles null/undefined alerts or reminders gracefully', () => {
    // Case 1: alerts is null
    mockUseAlerts.mockReturnValueOnce({
      alerts: null,
      allAlertsCount: 0,
      filteredAlertsCount: 0,
      upcomingReminders: sampleReminders, // Keep reminders for this part of test
      markAsViewed: mockMarkAsViewed,
      dismissAlert: mockDismissAlert,
      markAllAsViewed: mockMarkAllAsViewed,
    });
    const { rerender } = render(<AlertsDashboard />);    
    expect(screen.getByTestId('placeholder-card')).toBeInTheDocument(); // Should show placeholder for no alerts
    expect(screen.getByTestId('reminders-schedule')).toBeInTheDocument(); // Reminders should still render
    expect(screen.getByText('Follow up lead A')).toBeInTheDocument();
    
    // Case 2: upcomingReminders is null, alerts are present
    mockUseAlerts.mockReturnValueOnce({
      alerts: sampleAlerts,
      allAlertsCount: sampleAlerts.length,
      filteredAlertsCount: sampleAlerts.length,
      upcomingReminders: null,
      markAsViewed: mockMarkAsViewed,
      dismissAlert: mockDismissAlert,
      markAllAsViewed: mockMarkAllAsViewed,
    });
    rerender(<AlertsDashboard />); 
    expect(screen.getByTestId('alerts-list')).toBeInTheDocument(); // Alerts should render
    expect(screen.getByText(sampleAlerts[0].message)).toBeInTheDocument();
    // The RemindersSchedule mock should handle null reminders (e.g., render nothing or an empty state)
    // Assuming the mock for RemindersSchedule simply maps, it would receive an empty array due to `rawUpcomingReminders || []`
    // So, we check if the RemindersSchedule itself is there, but its content (from sampleReminders) won't be.
    expect(screen.getByTestId('reminders-schedule')).toBeInTheDocument();
    expect(screen.queryByText('Follow up lead A')).not.toBeInTheDocument(); 

    // Case 3: both are null
    mockUseAlerts.mockReturnValueOnce({
        alerts: null,
        allAlertsCount: 0,
        filteredAlertsCount: 0,
        upcomingReminders: null,
        markAsViewed: mockMarkAsViewed,
        dismissAlert: mockDismissAlert,
        markAllAsViewed: mockMarkAllAsViewed,
      });
      rerender(<AlertsDashboard />); 
      expect(screen.getByTestId('placeholder-card')).toBeInTheDocument();
      expect(screen.getByTestId('reminders-schedule')).toBeInTheDocument(); // Still renders, but empty
  });
}); 