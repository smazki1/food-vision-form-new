
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface ClientsOverviewProps {
  statusData: { status: string; count: number }[];
  packageData: { package_name: string; count: number }[];
  loading: boolean;
}

export function ClientsOverview({ statusData, packageData, loading }: ClientsOverviewProps) {
  const navigate = useNavigate();

  // Define colors for client statuses
  const getStatusColor = (status: string) => {
    switch (status) {
      case "פעיל":
        return "#22c55e"; // green-500
      case "לא פעיל":
        return "#ef4444"; // red-500
      case "בהמתנה":
        return "#f59e0b"; // amber-500
      default:
        return "#94a3b8"; // slate-400
    }
  };

  // Define colors for packages
  const packageColors = [
    "#3b82f6", // blue-500
    "#6366f1", // indigo-500
    "#8b5cf6", // violet-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#eab308", // yellow-500
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-bold">{`${payload[0].name}`}</p>
          <p className="text-sm">{`${payload[0].value} לקוחות (${payload[0].payload.percentage}%)`}</p>
        </div>
      );
    }
    return null;
  };

  // Calculate percentages
  const totalClients = statusData.reduce((sum, item) => sum + item.count, 0);
  
  const statusWithPercentage = statusData.map(item => ({
    ...item,
    percentage: Math.round((item.count / (totalClients || 1)) * 100)
  }));
  
  const packageWithPercentage = packageData.map(item => ({
    ...item,
    percentage: Math.round((item.count / (totalClients || 1)) * 100)
  }));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">סקירת לקוחות</CardTitle>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0" 
          onClick={() => navigate("/admin/clients")}
        >
          כל הלקוחות <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : statusData.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Status Distribution */}
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-center mb-2">לפי סטטוס</h4>
              <div className="h-48">
                <ChartContainer 
                  className="h-48 w-full" 
                  config={{
                    status: { theme: { light: "#94a3b8", dark: "#94a3b8" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusWithPercentage}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                        label={({ status, percentage }) => `${status} ${percentage}%`}
                      >
                        {statusWithPercentage.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={getStatusColor(entry.status)} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
            
            {/* Package Distribution */}
            <div className="flex flex-col">
              <h4 className="text-sm font-medium text-center mb-2">לפי חבילה</h4>
              <div className="h-48">
                <ChartContainer 
                  className="h-48 w-full"
                  config={{
                    package: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={packageWithPercentage}
                        dataKey="count"
                        nameKey="package_name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        labelLine={false}
                        label={({ package_name, percentage }) => 
                          `${percentage}% ${package_name.length > 10 
                            ? package_name.substring(0, 10) + '...' 
                            : package_name}`
                        }
                      >
                        {packageWithPercentage.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={packageColors[index % packageColors.length]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip content={CustomTooltip} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">אין נתוני לקוחות להצגה</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
