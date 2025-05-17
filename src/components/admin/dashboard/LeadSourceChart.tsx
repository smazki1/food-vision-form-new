
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface LeadSourceChartProps {
  data: { source: string; count: number }[];
  loading: boolean;
}

export function LeadSourceChart({ data, loading }: LeadSourceChartProps) {
  // Translate source names to Hebrew if needed and sort by count
  const processedData = [...data]
    .map(item => {
      const source = item.source === null ? "לא ידוע" : item.source;
      return { ...item, source };
    })
    .sort((a, b) => b.count - a.count);

  // Define colors for different lead sources
  const getSourceColor = (source: string) => {
    switch (source) {
      case "אתר":
        return "#3b82f6"; // blue-500
      case "הפניה":
        return "#10b981"; // emerald-500
      case "פייסבוק":
        return "#4f46e5"; // indigo-600
      case "אינסטגרם":
        return "#ec4899"; // pink-500
      case "אחר":
        return "#f59e0b"; // amber-500
      case "לא ידוע":
        return "#94a3b8"; // slate-400
      default:
        return "#6b7280"; // gray-500
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">לידים לפי מקור</CardTitle>
      </CardHeader>
      <CardContent className="py-1">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : processedData.length > 0 ? (
          <ChartContainer 
            className="h-64 w-full"
            config={{
              website: { theme: { light: "#3b82f6", dark: "#3b82f6" } },
              referral: { theme: { light: "#10b981", dark: "#10b981" } },
              facebook: { theme: { light: "#4f46e5", dark: "#4f46e5" } },
              instagram: { theme: { light: "#ec4899", dark: "#ec4899" } },
              other: { theme: { light: "#f59e0b", dark: "#f59e0b" } },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                margin={{ top: 10, right: 10, left: 10, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="source" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="font-bold">{data.source}</div>
                          <div className="text-sm">{data.count} לידים</div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {processedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSourceColor(entry.source)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <span className="text-muted-foreground">אין נתוני מקורות להצגה</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
