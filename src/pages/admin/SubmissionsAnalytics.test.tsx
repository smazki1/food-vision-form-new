import { render, screen, fireEvent } from '@testing-library/react';
import SubmissionsAnalytics from './SubmissionsAnalytics';
import { useDashboardStats } from '@/hooks/useDashboardStats';

// Mock hooks
jest.mock('@/hooks/useDashboardStats');

// Mock recharts due to its complexity in jsdom
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    Line: () => <div data-testid="line-element" />,
    Bar: () => <div data-testid="bar-element" />,
    Pie: () => <div data-testid="pie-element" />,
    XAxis: () => <div data-testid="xaxis-element" />,
    YAxis: () => <div data-testid="yaxis-element" />,
    CartesianGrid: () => <div data-testid="grid-element" />,
    Tooltip: () => <div data-testid="tooltip-element" />,
    Legend: () => <div data-testid="legend-element" />,
    Cell: () => <div data-testid="cell-element" />,
  };
});

// Mock ChartContainer UI component if it has complex logic or context dependencies
jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({ children }) => <div data-testid="chart-container">{children}</div>,
}));

describe('SubmissionsAnalytics Page', () => {
  const mockUseDashboardStats = useDashboardStats as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDashboardStats.mockReturnValue({
      data: null,
      isLoading: true,
    });
  });

  test('renders page title and tabs', () => {
    render(<SubmissionsAnalytics />);
    expect(screen.getByText('אנליטיקס')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'דוחות תפעוליים' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'דוחות פיננסיים' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'שביעות רצון לקוחות' })).toBeInTheDocument();
  });

  test('Performance tab: renders editor performance chart (with demo data)', () => {
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: false }); // isLoading false for demo data parts
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    
    expect(screen.getByText('ביצועי עורכים לאורך זמן')).toBeInTheDocument();
    // Check for elements that would be rendered by the (mocked) LineChart
    expect(screen.getAllByTestId('line-element').length).toBeGreaterThan(0);
  });

  test('Performance tab: Package Utilization chart shows loading state', () => {
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: true });
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('טוען נתוני ניצול חבילות...')).toBeInTheDocument();
  });

  test('Performance tab: Package Utilization chart shows empty state', () => {
    mockUseDashboardStats.mockReturnValue({
      data: { packageUtilization: [] }, // Empty data
      isLoading: false,
    });
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('אין נתונים להצגת ניצול חבילות.')).toBeInTheDocument();
  });

  test('Performance tab: Package Utilization chart handles null/undefined stats or packageUtilization gracefully', () => {
    // Test case 1: data is null
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: false });
    let { rerender } = render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('אין נתונים להצגת ניצול חבילות.')).toBeInTheDocument();

    // Test case 2: packageUtilization is null
    mockUseDashboardStats.mockReturnValue({ data: { packageUtilization: null }, isLoading: false });
    rerender(<SubmissionsAnalytics />); // Rerender with new mock value
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('אין נתונים להצגת ניצול חבילות.')).toBeInTheDocument();
    
    // Test case 3: packageUtilization is undefined
    mockUseDashboardStats.mockReturnValue({ data: { packageUtilization: undefined }, isLoading: false });
    rerender(<SubmissionsAnalytics />); // Rerender with new mock value
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('אין נתונים להצגת ניצול חבילות.')).toBeInTheDocument();
  });

  test('Performance tab: Package Utilization chart renders with data', () => {
    mockUseDashboardStats.mockReturnValue({
      data: {
        packageUtilization: [
          { package_name: 'Basic', client_count: 10, avg_remaining: 5 },
        ],
      },
      isLoading: false,
    });
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות תפעוליים' }));
    expect(screen.getByText('ניצול חבילות')).toBeInTheDocument();
    // Check that BarChart elements are rendered
    expect(screen.getAllByTestId('bar-element').length).toBeGreaterThan(0);
  });
  
  test('Financial tab: renders financial chart (with demo data)', () => {
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: false });
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'דוחות פיננסיים' }));
    expect(screen.getByText('נתונים פיננסיים')).toBeInTheDocument();
    expect(screen.getAllByTestId('bar-element').length).toBeGreaterThan(0);
  });

  test('Satisfaction tab: renders satisfaction pie chart (with demo data)', () => {
    mockUseDashboardStats.mockReturnValue({ data: null, isLoading: false });
    render(<SubmissionsAnalytics />);
    fireEvent.click(screen.getByRole('tab', { name: 'שביעות רצון לקוחות' }));
    expect(screen.getByText('שביעות רצון ממוצעת')).toBeInTheDocument(); // Or whatever title is there
    expect(screen.getByTestId('pie-element')).toBeInTheDocument();
  });
}); 