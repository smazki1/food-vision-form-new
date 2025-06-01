import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard'; // Adjust path as necessary
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardSettings, defaultSections } from '@/components/admin/dashboard/DashboardSettings';
import { useAlerts } from '@/hooks/useAlerts';

// Mock child components to display parts of their props for testing data flow
jest.mock('@/components/admin/dashboard/KPICard', () => ({ KPICard: (props) => <div data-testid={`kpi-card-${props.title}`} data-loading={props.loading} data-value={props.value}>KPI: {props.title} - {String(props.value)}</div> }));
jest.mock('@/components/admin/dashboard/AlertsOverview', () => () => <div data-testid="alerts-overview">AlertsOverview</div>); // Assuming this might have its own internal data fetching or complex rendering not tested here
jest.mock('@/components/admin/dashboard/LeadsFunnel', () => (props) => <div data-testid="leads-funnel" data-loading={props.loading} data-props={JSON.stringify(props.data)}>LeadsFunnel data_count: {props.data?.length || 0}</div>);
jest.mock('@/components/admin/dashboard/LeadSourceChart', () => (props) => <div data-testid="lead-source-chart" data-loading={props.loading} data-props={JSON.stringify(props.data)}>LeadSourceChart data_count: {props.data?.length || 0}</div>);
jest.mock('@/components/admin/dashboard/ClientsOverview', () => (props) => <div data-testid="clients-overview" data-loading={props.loading} data-status-count={props.statusData?.length || 0} data-package-count={props.packageData?.length || 0}>ClientsOverview</div>);
jest.mock('@/components/admin/dashboard/SubmissionQueue', () => (props) => <div data-testid="submission-queue" data-loading={props.loading} data-props={JSON.stringify(props.data)} data-overdue={props.totalOverdue}>SubmissionQueue data_count: {props.data?.length || 0}, overdue: {props.totalOverdue}</div>);
jest.mock('@/components/admin/dashboard/EditorPerformance', () => (props) => <div data-testid="editor-performance" data-loading={props.loading} data-props={JSON.stringify(props.data)}>EditorPerformance data_count: {props.data?.length || 0}</div>);
jest.mock('@/components/admin/dashboard/PackageUtilization', () => (props) => <div data-testid="package-utilization" data-loading={props.loading} data-props={JSON.stringify(props.data)}>PackageUtilization data_count: {props.data?.length || 0}</div>);
jest.mock('@/components/admin/dashboard/DashboardSearch', () => () => <div data-testid="dashboard-search">Search</div>);
// jest.mock('@/components/admin/dashboard/DashboardSettings', () => ({ DashboardSettings: () => <div data-testid="dashboard-settings-component">Settings</div> }));

// Mock hooks
jest.mock('@/hooks/useDashboardStats');
jest.mock('@/hooks/useAlerts');

// We need to control useDashboardSettings for some tests, but also test its default behavior
// So, we'll mock its module, but provide a way to control its return value.
jest.mock('@/components/admin/dashboard/DashboardSettings', () => {
  const originalModule = jest.requireActual('@/components/admin/dashboard/DashboardSettings');
  return {
    ...originalModule, // Keep original exports like defaultSections
    useDashboardSettings: jest.fn(), // Mock the hook itself
    DashboardSettings: () => <div data-testid="dashboard-settings-comp">SettingsComp</div>, // Mock the component part
  };
});

const mockUseDashboardStats = useDashboardStats as jest.Mock;
const mockUseAlerts = useAlerts as jest.Mock;
const mockUseDashboardSettings = useDashboardSettings as jest.Mock;

const emptyStatsData = {
  newLeadsThisMonth: 0,
  conversionRateThisMonth: 0,
  totalActiveClients: 0,
  submissionsInProgress: 0,
  leadsByStatus: [],
  leadsBySource: [],
  clientsByStatus: [],
  clientsByPackage: [],
  submissionsByStatus: [],
  overdueSubmissions: 0,
  editorPerformance: [],
  packageUtilization: [],
  completedSubmissionsThisWeek: 0,
  completedSubmissionsThisMonth: 0,
  inactiveClients: 0,
};

describe('Admin Dashboard Regression Tests', () => {
  beforeEach(() => {
    mockUseDashboardStats.mockReturnValue({ data: { ...emptyStatsData }, isLoading: false });
    mockUseAlerts.mockReturnValue({ upcomingReminders: [] });
    mockUseDashboardSettings.mockReturnValue({
      settings: { sections: defaultSections.map(s => ({...s, visible: true })).sort((a,b) => a.order - b.order) },
      toggleSectionVisibility: jest.fn(),
      moveSectionUp: jest.fn(),
      moveSectionDown: jest.fn(),
      resetSettings: jest.fn(),
    });
    localStorage.clear();
  });

  it('renders the main dashboard title and controls', () => {
    render(<Dashboard />);
    expect(screen.getByText('דאשבורד')).toBeInTheDocument();
    expect(screen.getByText('סקירה כללית של המערכת')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-search')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-settings-comp')).toBeInTheDocument();
  });

  it('shows loading state for sections when stats are loading', () => {
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: true });
    render(<Dashboard />);
    expect(screen.getByTestId('kpi-card-לידים חדשים (החודש)')).toHaveAttribute('data-loading', 'true');
    expect(screen.getByTestId('leads-funnel')).toHaveAttribute('data-loading', 'true');
    expect(screen.getByTestId('clients-overview')).toHaveAttribute('data-loading', 'true');
  });

  it('renders all default sections correctly when localStorage is empty (testing the fix)', async () => {
    const originalUseDashboardSettings = jest.requireActual('@/components/admin/dashboard/DashboardSettings').useDashboardSettings;
    mockUseDashboardSettings.mockImplementation(originalUseDashboardSettings);
    render(<Dashboard />);
    await waitFor(() => {
      defaultSections.forEach(section => {
        if (section.id === 'kpi') {
          expect(screen.getByTestId('kpi-card-לידים חדשים (החודש)')).toBeInTheDocument();
          expect(screen.getByTestId('kpi-card-יחס המרה (החודש)')).toBeInTheDocument();
        } else {
          expect(screen.getByTestId(section.id === 'alerts' ? 'alerts-overview' : section.id)).toBeInTheDocument();
        }
      });
    });
    expect(screen.queryByTestId('kpi-card-תזכורות להיום')).not.toBeInTheDocument();
  });

  it('renders only visible sections based on settings', () => {
    const customSections = defaultSections.map(s => ({
      ...s,
      visible: s.id === 'kpi' || s.id === 'alerts',
    })).sort((a,b) => a.order - b.order);
    mockUseDashboardSettings.mockReturnValue({ settings: { sections: customSections } });
    render(<Dashboard />);
    expect(screen.getByTestId('kpi-card-לידים חדשים (החודש)')).toBeInTheDocument();
    expect(screen.getByTestId('alerts-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('leads-funnel')).not.toBeInTheDocument();
  });

  it('renders extraKPIs (including no notifications card) when main KPI section is hidden and no reminders exist', () => {
    const customSections = defaultSections.map(s => ({ ...s, visible: s.id !== 'kpi' })).sort((a,b) => a.order - b.order);
    mockUseDashboardSettings.mockReturnValue({ settings: { sections: customSections } });
    mockUseAlerts.mockReturnValue({ upcomingReminders: [] }); // No reminders
    mockUseDashboardStats.mockReturnValue({ data: { ...emptyStatsData, completedSubmissionsThisWeek: 0 }, isLoading: false });

    render(<Dashboard />);
    expect(screen.queryByTestId('kpi-card-לידים חדשים (החודש)')).not.toBeInTheDocument();
    const remindersCard = screen.getByTestId('kpi-card-תזכורות להיום');
    expect(remindersCard).toBeInTheDocument();
    expect(remindersCard).toHaveAttribute('data-value', '0'); // Empty state for reminders
    expect(screen.getByTestId('kpi-card-מנות שהושלמו (השבוע)')).toHaveAttribute('data-value', '0');
  });

  it('renders extraKPIs with correct reminder count when reminders exist', () => {
    const customSections = defaultSections.map(s => ({ ...s, visible: s.id !== 'kpi' })).sort((a,b) => a.order - b.order);
    mockUseDashboardSettings.mockReturnValue({ settings: { sections: customSections } });
    const today = new Date().toISOString();
    mockUseAlerts.mockReturnValue({ upcomingReminders: [ { reminder_at: today }, { reminder_at: today } ] }); // 2 reminders

    render(<Dashboard />);
    const remindersCard = screen.getByTestId('kpi-card-תזכורות להיום');
    expect(remindersCard).toBeInTheDocument();
    expect(remindersCard).toHaveAttribute('data-value', '2');
  });

  it('correctly fetches and displays dynamic data across all relevant sections', () => {
    const mockData = {
      newLeadsThisMonth: 10,
      conversionRateThisMonth: 0.5,
      totalActiveClients: 20,
      submissionsInProgress: 5,
      leadsByStatus: [{ status: 'new', count: 10 }],
      leadsBySource: [{ source: 'web', count: 10 }],
      clientsByStatus: [{ status: 'active', count: 20 }],
      clientsByPackage: [{ package: 'premium', count: 10 }],
      submissionsByStatus: [{ status: 'pending', count: 5 }],
      overdueSubmissions: 2,
      editorPerformance: [{ editor: 'John', count: 15 }],
      packageUtilization: [{ package: 'basic', utilization: 0.8 }],
      completedSubmissionsThisWeek: 7,
      completedSubmissionsThisMonth: 30,
      inactiveClients: 3,
    };
    mockUseDashboardStats.mockReturnValue({ data: mockData, isLoading: false });
    render(<Dashboard />);

    // KPI Section
    expect(screen.getByTestId('kpi-card-לידים חדשים (החודש)')).toHaveAttribute('data-value', '10');
    expect(screen.getByTestId('kpi-card-יחס המרה (החודש)')).toHaveAttribute('data-value', '0.5');
    expect(screen.getByTestId('kpi-card-לקוחות פעילים')).toHaveAttribute('data-value', '20');
    expect(screen.getByTestId('kpi-card-מנות בעיבוד כרגע')).toHaveAttribute('data-value', '5');

    // Other Sections (checking data via refined mocks)
    const leadsFunnel = screen.getByTestId('leads-funnel');
    expect(leadsFunnel).toHaveTextContent('LeadsFunnel data_count: 1');
    expect(leadsFunnel).toHaveAttribute('data-props', JSON.stringify(mockData.leadsByStatus));

    const leadSourceChart = screen.getByTestId('lead-source-chart');
    expect(leadSourceChart).toHaveTextContent('LeadSourceChart data_count: 1');
    expect(leadSourceChart).toHaveAttribute('data-props', JSON.stringify(mockData.leadsBySource));
    
    const clientsOverview = screen.getByTestId('clients-overview');
    expect(clientsOverview).toHaveAttribute('data-status-count', String(mockData.clientsByStatus.length));
    expect(clientsOverview).toHaveAttribute('data-package-count', String(mockData.clientsByPackage.length));

    const submissionQueue = screen.getByTestId('submission-queue');
    expect(submissionQueue).toHaveTextContent('SubmissionQueue data_count: 1, overdue: 2');
    expect(submissionQueue).toHaveAttribute('data-props', JSON.stringify(mockData.submissionsByStatus));
    expect(submissionQueue).toHaveAttribute('data-overdue', '2');

    const editorPerformance = screen.getByTestId('editor-performance');
    expect(editorPerformance).toHaveTextContent('EditorPerformance data_count: 1');
    expect(editorPerformance).toHaveAttribute('data-props', JSON.stringify(mockData.editorPerformance));

    const packageUtilization = screen.getByTestId('package-utilization');
    expect(packageUtilization).toHaveTextContent('PackageUtilization data_count: 1');
    expect(packageUtilization).toHaveAttribute('data-props', JSON.stringify(mockData.packageUtilization));
  });

  it('handles and displays empty states for list-based sections', () => {
    // Using emptyStatsData which is set in beforeEach
    mockUseDashboardStats.mockReturnValue({ data: { ...emptyStatsData }, isLoading: false });
    render(<Dashboard />);

    // Check a few representative list-based sections
    expect(screen.getByTestId('leads-funnel')).toHaveTextContent('LeadsFunnel data_count: 0');
    expect(screen.getByTestId('lead-source-chart')).toHaveTextContent('LeadSourceChart data_count: 0');
    expect(screen.getByTestId('clients-overview')).toHaveAttribute('data-status-count', '0');
    expect(screen.getByTestId('clients-overview')).toHaveAttribute('data-package-count', '0');
    expect(screen.getByTestId('submission-queue')).toHaveTextContent('SubmissionQueue data_count: 0, overdue: 0');
    expect(screen.getByTestId('editor-performance')).toHaveTextContent('EditorPerformance data_count: 0');
    expect(screen.getByTestId('package-utilization')).toHaveTextContent('PackageUtilization data_count: 0');
  });

}); 