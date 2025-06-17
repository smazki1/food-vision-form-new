
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Clock,
  Download,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface AnalyticsData {
  totalRevenue: number;
  totalAICosts: number;
  netProfit: number;
  roi: number;
  activeClients: number;
  conversionRate: number;
  submissionsByStatus: Array<{ status: string; count: number }>;
  revenueVsCosts: Array<{ month: string; revenue: number; costs: number }>;
  workSessionsByType: Array<{ type: string; hours: number; sessions: number }>;
  leadSources: Array<{ source: string; total: number; converted: number }>;
  packageUtilization: Array<{ packageName: string; total: number; used: number; remaining: number }>;
}

const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch analytics data
  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics-data', timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      
      // Fetch clients and revenue data
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          service_packages(price, package_name)
        `)
        .gte('created_at', daysAgo.toISOString());

      if (clientsError) throw clientsError;

      // Fetch submissions data
      const { data: submissions, error: submissionsError } = await supabase
        .from('customer_submissions')
        .select('*')
        .gte('created_at', daysAgo.toISOString());

      if (submissionsError) throw submissionsError;

      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', daysAgo.toISOString());

      if (leadsError) throw leadsError;

      // Fetch work sessions data
      const { data: workSessions, error: workSessionsError } = await supabase
        .from('work_sessions')
        .select('*')
        .gte('created_at', daysAgo.toISOString());

      if (workSessionsError) throw workSessionsError;

      // Calculate analytics
      const totalRevenue = clients?.reduce((sum, client) => {
        const packagePrice = client.service_packages?.price || 0;
        return sum + packagePrice;
      }, 0) || 0;

      const totalAICosts = clients?.reduce((sum, client) => {
        const aiCosts = client.total_ai_costs || 0;
        const exchangeRate = client.exchange_rate_at_conversion || 3.5;
        return sum + (aiCosts * exchangeRate);
      }, 0) || 0;

      const netProfit = totalRevenue - totalAICosts;
      const roi = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      const activeClients = clients?.filter(c => c.client_status === 'פעיל')?.length || 0;
      
      const totalLeads = leads?.length || 0;
      const convertedLeads = leads?.filter(l => l.lead_status === 'הפך ללקוח')?.length || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      // Submissions by status
      const submissionsByStatus = submissions?.reduce((acc, sub) => {
        const status = sub.submission_status;
        const existing = acc.find(item => item.status === status);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ status, count: 1 });
        }
        return acc;
      }, [] as Array<{ status: string; count: number }>) || [];

      // Revenue vs costs by month (mock data for demonstration)
      const revenueVsCosts = [
        { month: 'ינואר', revenue: totalRevenue * 0.7, costs: totalAICosts * 0.6 },
        { month: 'פברואר', revenue: totalRevenue * 0.8, costs: totalAICosts * 0.7 },
        { month: 'מרץ', revenue: totalRevenue * 0.9, costs: totalAICosts * 0.8 },
        { month: 'אפריל', revenue: totalRevenue, costs: totalAICosts },
      ];

      // Work sessions by type
      const workSessionsByType = workSessions?.reduce((acc, session) => {
        const type = session.work_type || 'כללי';
        const existing = acc.find(item => item.type === type);
        const hours = (session.duration_minutes || 0) / 60;
        
        if (existing) {
          existing.hours += hours;
          existing.sessions++;
        } else {
          acc.push({ type, hours, sessions: 1 });
        }
        return acc;
      }, [] as Array<{ type: string; hours: number; sessions: number }>) || [];

      // Lead sources (mock data)
      const leadSources = [
        { source: 'אתר', total: totalLeads * 0.4, converted: convertedLeads * 0.5 },
        { source: 'המלצות', total: totalLeads * 0.3, converted: convertedLeads * 0.3 },
        { source: 'רשתות חברתיות', total: totalLeads * 0.2, converted: convertedLeads * 0.15 },
        { source: 'אחר', total: totalLeads * 0.1, converted: convertedLeads * 0.05 },
      ];

      // Package utilization
      const packageUtilization = clients?.reduce((acc, client) => {
        const packageName = client.service_packages?.package_name || 'לא ידוע';
        const totalServings = client.service_packages?.total_servings || 0;
        const remainingServings = client.remaining_servings || 0;
        const usedServings = totalServings - remainingServings;

        const existing = acc.find(item => item.packageName === packageName);
        if (existing) {
          existing.total += totalServings;
          existing.used += usedServings;
          existing.remaining += remainingServings;
        } else {
          acc.push({
            packageName,
            total: totalServings,
            used: usedServings,
            remaining: remainingServings
          });
        }
        return acc;
      }, [] as Array<{ packageName: string; total: number; used: number; remaining: number }>) || [];

      return {
        totalRevenue,
        totalAICosts,
        netProfit,
        roi,
        activeClients,
        conversionRate,
        submissionsByStatus,
        revenueVsCosts,
        workSessionsByType,
        leadSources,
        packageUtilization,
      } as AnalyticsData;
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="ml-3 text-muted-foreground">טוען נתונים...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">שגיאה בטעינת הנתונים</p>
          <Button onClick={handleRefresh}>נסה שוב</Button>
        </div>
      </div>
    );
  }

  const data = analyticsData!;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              דאשבורד אנליטיקה
            </h1>
            <p className="text-muted-foreground">
              מבט כולל על ביצועי העסק ואינטליגנציה עסקית
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="בחר טווח זמן" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 ימים אחרונים</SelectItem>
                <SelectItem value="90">90 ימים אחרונים</SelectItem>
                <SelectItem value="180">180 ימים אחרונים</SelectItem>
                <SelectItem value="365">שנה אחרונה</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              ייצא דוח
            </Button>
          </div>
        </div>
      </div>

      {/* Executive Summary KPIs */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">מדדי ביצוע עיקריים</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סך הכנסות</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
                +12.5% מהחודש הקודם
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">עלויות AI</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.totalAICosts)}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingDown className="inline h-3 w-3 mr-1 text-red-500" />
                -5.2% מהחודש הקודם
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">רווח נקי</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(data.netProfit)}</div>
              <p className="text-xs text-muted-foreground">
                ROI: {formatPercentage(data.roi)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">לקוחות פעילים</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.activeClients}</div>
              <p className="text-xs text-muted-foreground">לקוחות עם סטטוס פעיל</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">שיעור המרה</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(data.conversionRate)}</div>
              <p className="text-xs text-muted-foreground">מלידים ללקוחות</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">זמן עיבוד ממוצע</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.3 ימים</div>
              <p className="text-xs text-muted-foreground">מהגשה לאישור</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Financial Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">אנליטיקה פיננסית</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>הכנסות מול עלויות</CardTitle>
              <CardDescription>השוואה חודשית</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.revenueVsCosts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0088FE" name="הכנסות" />
                  <Bar dataKey="costs" fill="#FF8042" name="עלויות" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>פילוח מקורות לידים</CardTitle>
              <CardDescription>ביצועי המרה לפי מקור</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.leadSources}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ source, total }) => `${source}: ${total}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {data.leadSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operational Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">אנליטיקה תפעולית</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>סטטוס הגשות</CardTitle>
              <CardDescription>פילוח הגשות לפי סטטוס</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.submissionsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>סשני עבודה לפי סוג</CardTitle>
              <CardDescription>זמן עבודה בשעות</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.workSessionsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(1)} שעות`} />
                  <Bar dataKey="hours" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Package Utilization */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">ניצול חבילות שירות</h2>
        <Card>
          <CardHeader>
            <CardTitle>מנות שנוצלו לעומת זמינות</CardTitle>
            <CardDescription>התפלגות השימוש בחבילות השונות</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.packageUtilization}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="packageName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="used" stackId="a" fill="#0088FE" name="נוצל" />
                <Bar dataKey="remaining" stackId="a" fill="#FFBB28" name="נותר" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        עודכן לאחרונה: {formatDate(new Date().toISOString())}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
