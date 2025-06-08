import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';

// Interface for the cost data
interface ClientCostData {
  total_ai_costs: number;
  total_revenue: number;
  roi_percentage: number;
  trainings_costs: number;
  prompts_costs: number;
  trainings_count: number;
  prompts_count: number;
  by_status: {
    status: string;
    status_count: number;
    status_costs: number;
    status_revenue: number;
    status_roi: number;
  }[];
  by_package: {
    package_name: string;
    package_count: number;
    package_costs: number;
    package_revenue: number;
    package_roi: number;
  }[];
  by_month: {
    month: string;
    costs: number;
    revenue: number;
    roi: number;
  }[];
}

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const ClientCostsReportPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180' | '365' | 'all'>('90');
  
  // Fetch cost data for clients
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-costs-report', timeRange],
    queryFn: async () => {
      // For now, we'll use a simplified query since we don't have the RPC function yet
      const { data: clients, error } = await supabase
        .from('clients')
        .select(`
          client_id,
          client_status,
          ai_training_5_count,
          ai_training_15_count,
          ai_training_25_count,
          ai_prompts_count,
          ai_prompt_cost_per_unit,
          revenue_from_client_local,
          exchange_rate_at_conversion,
          total_ai_costs,
          revenue_from_client_usd,
          roi,
          created_at,
          current_package_id,
          service_packages:current_package_id(package_name)
        `);
      
      if (error) throw error;
      
      // Process the data to match the expected interface
      const processedData: ClientCostData = {
        total_ai_costs: 0,
        total_revenue: 0,
        roi_percentage: 0,
        trainings_costs: 0,
        prompts_costs: 0,
        trainings_count: 0,
        prompts_count: 0,
        by_status: [],
        by_package: [],
        by_month: []
      };
      
      if (!clients || clients.length === 0) {
        return processedData;
      }
      
      // Calculate totals
      processedData.total_ai_costs = clients.reduce((sum, client) => sum + (client.total_ai_costs || 0), 0);
      processedData.total_revenue = clients.reduce((sum, client) => sum + (client.revenue_from_client_usd || 0), 0);
      processedData.trainings_count = clients.reduce((sum, client) => 
        sum + (client.ai_training_5_count || 0) + (client.ai_training_15_count || 0) + (client.ai_training_25_count || 0), 0);
      processedData.prompts_count = clients.reduce((sum, client) => sum + (client.ai_prompts_count || 0), 0);
      processedData.trainings_costs = clients.reduce((sum, client) => 
        sum + ((client.ai_training_5_count || 0) * 5) + 
              ((client.ai_training_15_count || 0) * 1.5) + 
              ((client.ai_training_25_count || 0) * 2.5), 0);
      processedData.prompts_costs = clients.reduce((sum, client) => 
        sum + ((client.ai_prompts_count || 0) * (client.ai_prompt_cost_per_unit || 0.162)), 0);
      
      if (processedData.total_ai_costs > 0) {
        processedData.roi_percentage = ((processedData.total_revenue - processedData.total_ai_costs) / processedData.total_ai_costs) * 100;
      }
      
      // Group by status
      const statusGroups = clients.reduce((acc, client) => {
        const status = client.client_status || 'לא מוגדר';
        if (!acc[status]) {
          acc[status] = { count: 0, costs: 0, revenue: 0 };
        }
        acc[status].count += 1;
        acc[status].costs += client.total_ai_costs || 0;
        acc[status].revenue += client.revenue_from_client_usd || 0;
        return acc;
      }, {} as Record<string, { count: number; costs: number; revenue: number }>);
      
      processedData.by_status = Object.entries(statusGroups).map(([status, data]) => ({
        status,
        status_count: data.count,
        status_costs: data.costs,
        status_revenue: data.revenue,
        status_roi: data.costs > 0 ? ((data.revenue - data.costs) / data.costs) * 100 : 0
      }));
      
      return processedData;
    },
  });
  
  // Handle export to CSV
  const handleExportCSV = () => {
    if (!data) return;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Category,Metric,Value\n";
    
    // Overall metrics
    csvContent += `Overall,Total AI Costs,${data.total_ai_costs}\n`;
    csvContent += `Overall,Total Revenue,${data.total_revenue}\n`;
    csvContent += `Overall,ROI,${data.roi_percentage}\n`;
    csvContent += `Overall,Trainings Count,${data.trainings_count}\n`;
    csvContent += `Overall,Trainings Costs,${data.trainings_costs}\n`;
    csvContent += `Overall,Prompts Count,${data.prompts_count}\n`;
    csvContent += `Overall,Prompts Costs,${data.prompts_costs}\n`;
    
    // By status
    data.by_status.forEach(status => {
      csvContent += `Status: ${status.status},Count,${status.status_count}\n`;
      csvContent += `Status: ${status.status},Costs,${status.status_costs}\n`;
      csvContent += `Status: ${status.status},Revenue,${status.status_revenue}\n`;
      csvContent += `Status: ${status.status},ROI,${status.status_roi}\n`;
    });
    
    // Create download link and trigger click
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `client-costs-report-${timeRange}-days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold text-red-600 mb-2">שגיאה בטעינת הדוח</h2>
          <p>{(error as Error).message}</p>
          <Button asChild className="mt-4">
            <Link to="/admin/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לקוחות
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // If no data is available yet
  if (!data) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold mb-2">אין נתונים זמינים</h2>
          <p>עדיין אין נתוני עלויות AI ללקוחות לתצוגה</p>
          <Button asChild className="mt-4">
            <Link to="/admin/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לקוחות
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Prepare data for pie chart - AI Costs Breakdown
  const costBreakdownData = [
    { name: 'אימונים', value: data.trainings_costs },
    { name: 'פרומפטים', value: data.prompts_costs }
  ];
  
  // Prepare data for status distribution chart
  const statusDistributionData = data.by_status.map(status => ({
    name: status.status,
    costs: status.status_costs
  }));

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" asChild className="mr-4">
            <Link to="/admin/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לקוחות
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">דוח עלויות AI ללקוחות</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="flex items-center"
          >
            <Download className="mr-2 h-4 w-4" />
            ייצוא לקובץ CSV
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה"כ עלויות AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_ai_costs)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.trainings_count)} אימונים, {formatNumber(data.prompts_count)} פרומפטים
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.roi_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercentage(data.roi_percentage)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">עלות ממוצעת ללקוח</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data.by_status.reduce((sum, status) => sum + status.status_count, 0) > 0
                  ? data.total_ai_costs / data.by_status.reduce((sum, status) => sum + status.status_count, 0)
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* AI Costs Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>פילוח עלויות AI</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costBreakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {costBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        {/* Costs by Client Status */}
        <Card>
          <CardHeader>
            <CardTitle>עלויות לפי סטטוס לקוח</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="costs" fill="#8884d8" name="עלויות AI" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט לפי סטטוס לקוח</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-right text-sm font-medium">סטטוס</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">כמות לקוחות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">עלויות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">הכנסות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.by_status.map((status, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-2 text-sm">{status.status}</td>
                      <td className="px-4 py-2 text-sm">{status.status_count}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(status.status_costs)}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(status.status_revenue)}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={status.status_roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(status.status_roi)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientCostsReportPage; 