
import React, { useState } from "react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  LineChart,
  Line,
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
  Cell,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const SubmissionsAnalytics: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const [activeTab, setActiveTab] = useState("performance");

  // Demo data for the charts - in a real implementation, this would come from API/database
  const performanceData = [
    { month: "ינואר", completed: 65, processing_time: 2.3, edits: 1.2 },
    { month: "פברואר", completed: 59, processing_time: 2.1, edits: 1.3 },
    { month: "מרץ", completed: 80, processing_time: 1.9, edits: 1.1 },
    { month: "אפריל", completed: 81, processing_time: 1.8, edits: 1.0 },
    { month: "מאי", completed: 56, processing_time: 2.0, edits: 1.2 },
    { month: "יוני", completed: 55, processing_time: 2.1, edits: 1.3 },
  ];
  
  const financialData = [
    { month: "ינואר", revenue: 12500, expenses: 8200, profit: 4300 },
    { month: "פברואר", revenue: 11800, expenses: 7900, profit: 3900 },
    { month: "מרץ", revenue: 15600, expenses: 9200, profit: 6400 },
    { month: "אפריל", revenue: 16200, expenses: 9400, profit: 6800 },
    { month: "מאי", revenue: 14000, expenses: 8800, profit: 5200 },
    { month: "יוני", revenue: 13800, expenses: 8600, profit: 5200 },
  ];
  
  const satisfactionData = [
    { name: "אישור ללא תיקונים", value: 68 },
    { name: "תיקון אחד", value: 22 },
    { name: "שני תיקונים", value: 7 },
    { name: "שלושה+ תיקונים", value: 3 },
  ];
  
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">אנליטיקס</h1>
        <p className="text-muted-foreground">מדדי ביצוע ודוחות מערכתיים</p>
      </div>
      
      <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="performance">דוחות תפעוליים</TabsTrigger>
          <TabsTrigger value="financial">דוחות פיננסיים</TabsTrigger>
          <TabsTrigger value="satisfaction">שביעות רצון לקוחות</TabsTrigger>
        </TabsList>
        
        {/* Operational Reports */}
        <TabsContent value="performance" className="space-y-6">
          {/* Editor Performance */}
          <Card>
            <CardHeader>
              <CardTitle>ביצועי עורכים לאורך זמן</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ChartContainer 
                  className="h-80 w-full"
                  config={{
                    completed: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                    processing_time: { theme: { light: "#f97316", dark: "#f97316" } },
                    edits: { theme: { light: "#ef4444", dark: "#ef4444" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={performanceData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="completed" 
                        name="מנות שהושלמו" 
                        stroke="var(--color-completed)" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="processing_time" 
                        name="זמן עיבוד ממוצע (ימים)" 
                        stroke="var(--color-processing_time)" 
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="edits" 
                        name="תיקונים בממוצע למנה" 
                        stroke="var(--color-edits)" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Package Utilization */}
          <Card>
            <CardHeader>
              <CardTitle>ניצול חבילות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ChartContainer 
                  className="h-80 w-full"
                  config={{
                    basic: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                    standard: { theme: { light: "#10b981", dark: "#10b981" } },
                    premium: { theme: { light: "#8b5cf6", dark: "#8b5cf6" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={stats?.packageUtilization || []}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="package_name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="client_count" 
                        name="מספר לקוחות" 
                        fill="var(--color-basic)"
                      />
                      <Bar 
                        dataKey="avg_remaining" 
                        name="מנות נותרו (ממוצע)" 
                        fill="var(--color-standard)" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>נתונים פיננסיים</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ChartContainer 
                  className="h-80 w-full"
                  config={{
                    revenue: { theme: { light: "#10b981", dark: "#10b981" } },
                    expenses: { theme: { light: "#ef4444", dark: "#ef4444" } },
                    profit: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={financialData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="הכנסות" 
                        fill="var(--color-revenue)" 
                      />
                      <Bar 
                        dataKey="expenses" 
                        name="הוצאות" 
                        fill="var(--color-expenses)" 
                      />
                      <Bar 
                        dataKey="profit" 
                        name="רווח" 
                        fill="var(--color-profit)" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>הכנסות לפי סוג חבילה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mt-4">
                  <ChartContainer 
                    className="h-64 w-full"
                    config={{
                      pie: { theme: { light: "#0088FE", dark: "#0088FE" } },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "בסיסי", value: 25 },
                            { name: "סטנדרט", value: 45 },
                            { name: "פרימיום", value: 30 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {satisfactionData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>חבילות פעילות לאורך זמן</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mt-4">
                  <ChartContainer 
                    className="h-64 w-full"
                    config={{
                      basic: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                      standard: { theme: { light: "#10b981", dark: "#10b981" } },
                      premium: { theme: { light: "#8b5cf6", dark: "#8b5cf6" } },
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: "ינואר", basic: 12, standard: 19, premium: 8 },
                          { month: "פברואר", basic: 14, standard: 18, premium: 9 },
                          { month: "מרץ", basic: 16, standard: 20, premium: 12 },
                          { month: "אפריל", basic: 18, standard: 22, premium: 14 },
                          { month: "מאי", basic: 17, standard: 24, premium: 16 },
                          { month: "יוני", basic: 19, standard: 26, premium: 15 },
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="basic"
                          name="בסיסי"
                          stroke="var(--color-basic)"
                        />
                        <Line
                          type="monotone"
                          dataKey="standard"
                          name="סטנדרט"
                          stroke="var(--color-standard)"
                        />
                        <Line
                          type="monotone"
                          dataKey="premium"
                          name="פרימיום"
                          stroke="var(--color-premium)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Customer Satisfaction */}
        <TabsContent value="satisfaction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>שיעור תיקונים למנות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ChartContainer 
                  className="h-80 w-full"
                  config={{
                    satisfaction: { theme: { light: "#0088FE", dark: "#0088FE" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={satisfactionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {satisfactionData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>זמני אישור הגשות (ימים)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 mt-4">
                <ChartContainer 
                  className="h-80 w-full"
                  config={{
                    approval_time: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { client: "מסעדה א'", approval_time: 1.2 },
                        { client: "מסעדה ב'", approval_time: 0.8 },
                        { client: "מסעדה ג'", approval_time: 2.1 },
                        { client: "מסעדה ד'", approval_time: 1.5 },
                        { client: "מסעדה ה'", approval_time: 0.9 },
                        { client: "מסעדה ו'", approval_time: 1.7 },
                        { client: "מסעדה ז'", approval_time: 1.1 },
                        { client: "מסעדה ח'", approval_time: 1.3 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="client" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="approval_time"
                        name="זמן לאישור (ימים)"
                        fill="var(--color-approval_time)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SubmissionsAnalytics;
