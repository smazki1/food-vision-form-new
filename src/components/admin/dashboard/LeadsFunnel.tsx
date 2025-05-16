
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface LeadsFunnelProps {
  data: { status: string; count: number }[];
  loading: boolean;
}

export function LeadsFunnel({ data, loading }: LeadsFunnelProps) {
  const navigate = useNavigate();
  
  // Sort the data to match the lead funnel progression
  const statusOrder = [
    "ליד חדש",
    "פנייה ראשונית בוצעה",
    "מעוניין",
    "נקבעה פגישה/שיחה",
    "הדגמה בוצעה",
    "הצעת מחיר נשלחה",
    "ממתין לתשובה",
    "הפך ללקוח",
    "לא מעוניין",
  ];
  
  const sortedData = [...data].sort((a, b) => {
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });

  // Define colors for the funnel stages
  const getBarColor = (status: string) => {
    switch (status) {
      case "ליד חדש":
        return "#93c5fd"; // blue-300
      case "פנייה ראשונית בוצעה":
        return "#60a5fa"; // blue-400
      case "מעוניין":
        return "#3b82f6"; // blue-500
      case "נקבעה פגישה/שיחה":
        return "#2563eb"; // blue-600
      case "הדגמה בוצעה":
        return "#1d4ed8"; // blue-700
      case "הצעת מחיר נשלחה":
        return "#1e40af"; // blue-800
      case "ממתין לתשובה":
        return "#1e3a8a"; // blue-900
      case "הפך ללקוח":
        return "#15803d"; // green-700
      case "לא מעוניין":
        return "#b91c1c"; // red-700
      default:
        return "#94a3b8"; // slate-400
    }
  };

  const customTooltip = (props: TooltipProps<any, any>) => {
    if (props.active && props.payload && props.payload.length) {
      const data = props.payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="font-bold">{data.status}</div>
          <div className="text-sm">
            {data.count} לידים ({data.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate percentage for each status
  const totalLeads = data.reduce((sum, item) => sum + item.count, 0);
  const dataWithPercentage = sortedData.map((item) => ({
    ...item,
    percentage: totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">משפך לידים</CardTitle>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0" 
          onClick={() => navigate("/admin/leads")}
        >
          ניהול לידים <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="py-1">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : dataWithPercentage.length > 0 ? (
          <ChartContainer
            config={{
              new: { theme: { light: "#93c5fd", dark: "#93c5fd" } },
              interested: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
              converted: { theme: { light: "#15803d", dark: "#15803d" } },
              not_interested: { theme: { light: "#b91c1c", dark: "#b91c1c" } },
            }}
            className="h-64 w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataWithPercentage}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={120}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                />
                <Tooltip content={customTooltip} />
                <Bar
                  dataKey="count"
                  fill="var(--color-new)"
                  radius={[4, 4, 4, 4]}
                  fillOpacity={0.9}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">אין נתונים להצגה</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
