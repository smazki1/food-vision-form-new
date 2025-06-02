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
interface AICostData {
  total_ai_costs: number;
  total_revenue: number;
  roi_percentage: number;
  trainings_costs: number;
  prompts_costs: number;
  trainings_count: number;
  prompts_count: number;
  by_source: {
    lead_source: string;
    source_count: number;
    source_costs: number;
    source_revenue: number;
    source_roi: number;
  }[];
  by_status: {
    status: string;
    status_count: number;
    status_costs: number;
    status_revenue: number;
    status_roi: number;
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

const CostsReportPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30' | '90' | '180' | '365' | 'all'>('90');
  
  // Fetch cost data
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-costs-report', timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_ai_costs_report', {
        days_back: timeRange === 'all' ? null : parseInt(timeRange, 10)
      });
      
      if (error) throw error;
      return data as AICostData;
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
    
    // By source
    data.by_source.forEach(source => {
      csvContent += `Source: ${source.lead_source},Count,${source.source_count}\n`;
      csvContent += `Source: ${source.lead_source},Costs,${source.source_costs}\n`;
      csvContent += `Source: ${source.lead_source},Revenue,${source.source_revenue}\n`;
      csvContent += `Source: ${source.lead_source},ROI,${source.source_roi}\n`;
    });
    
    // By status
    data.by_status.forEach(status => {
      csvContent += `Status: ${status.status},Count,${status.status_count}\n`;
      csvContent += `Status: ${status.status},Costs,${status.status_costs}\n`;
      csvContent += `Status: ${status.status},Revenue,${status.status_revenue}\n`;
      csvContent += `Status: ${status.status},ROI,${status.status_roi}\n`;
    });
    
    // By month
    data.by_month.forEach(month => {
      csvContent += `Month: ${month.month},Costs,${month.costs}\n`;
      csvContent += `Month: ${month.month},Revenue,${month.revenue}\n`;
      csvContent += `Month: ${month.month},ROI,${month.roi}\n`;
    });
    
    // Create download link and trigger click
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ai-costs-report-${timeRange}-days.csv`);
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
            <Link to="/admin/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לידים
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
          <p>עדיין אין נתוני עלויות AI לתצוגה</p>
          <Button asChild className="mt-4">
            <Link to="/admin/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לידים
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
  
  // Prepare data for source distribution chart
  const sourceDistributionData = data.by_source.map(source => ({
    name: source.lead_source,
    costs: source.source_costs
  }));
  
  // Prepare data for monthly trends chart
  const monthlyTrendsData = data.by_month;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="outline" asChild className="mr-4">
            <Link to="/admin/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לידים
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">דוח עלויות AI ללידים</h1>
        </div>
        
        <div className="flex items-center space-x-2 space-x-reverse">
          <Select 
            value={timeRange} 
            onValueChange={(value) => setTimeRange(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="בחר טווח זמן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 ימים אחרונים</SelectItem>
              <SelectItem value="90">90 ימים אחרונים</SelectItem>
              <SelectItem value="180">6 חודשים אחרונים</SelectItem>
              <SelectItem value="365">שנה אחרונה</SelectItem>
              <SelectItem value="all">כל הזמנים</SelectItem>
            </SelectContent>
          </Select>
          
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
            <CardTitle className="text-sm font-medium">עלות ממוצעת לליד</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                data.by_source.reduce((sum, src) => sum + src.source_count, 0) > 0
                  ? data.total_ai_costs / data.by_source.reduce((sum, src) => sum + src.source_count, 0)
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
        
        {/* Costs by Lead Source */}
        <Card>
          <CardHeader>
            <CardTitle>עלויות לפי מקור ליד</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceDistributionData}>
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
        
        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>מגמות חודשיות - עלויות והכנסות</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar yAxisId="left" dataKey="costs" fill="#8884d8" name="עלויות AI" />
                <Bar yAxisId="right" dataKey="revenue" fill="#82ca9d" name="הכנסות" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Source */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט לפי מקור ליד</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-right text-sm font-medium">מקור</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">כמות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">עלויות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">הכנסות</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.by_source.map((source, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                      <td className="px-4 py-2 text-sm">{source.lead_source}</td>
                      <td className="px-4 py-2 text-sm">{source.source_count}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(source.source_costs)}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(source.source_revenue)}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={source.source_roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatPercentage(source.source_roi)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>פירוט לפי סטטוס</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-2 text-right text-sm font-medium">סטטוס</th>
                    <th className="px-4 py-2 text-right text-sm font-medium">כמות</th>
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

export default CostsReportPage; 