
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";

interface MonthlyStats {
  month: string;
  count: number;
}

const SubmissionsAnalytics: React.FC = () => {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [dishesCount, setDishesCount] = useState(0);
  const [cocktailsCount, setCocktailsCount] = useState(0);
  const [drinksCount, setDrinksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      // Get total counts
      const [dishesRes, cocktailsRes, drinksRes] = await Promise.all([
        supabase.from("dishes").select("dish_id", { count: "exact", head: true }),
        supabase.from("cocktails").select("cocktail_id", { count: "exact", head: true }),
        supabase.from("drinks").select("drink_id", { count: "exact", head: true }),
      ]);
      
      setDishesCount(dishesRes.count || 0);
      setCocktailsCount(cocktailsRes.count || 0);
      setDrinksCount(drinksRes.count || 0);
      
      // Get clients with their creation dates
      const { data: clients } = await supabase
        .from("clients")
        .select("created_at")
        .order("created_at", { ascending: true });
      
      if (clients) {
        // Process data for monthly submissions chart
        const monthlyData = processMonthlyData(clients);
        setMonthlyStats(monthlyData);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyData = (clients: any[]): MonthlyStats[] => {
    const monthCounts: Record<string, number> = {};
    
    clients.forEach(client => {
      const date = new Date(client.created_at);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (monthCounts[monthYear]) {
        monthCounts[monthYear]++;
      } else {
        monthCounts[monthYear] = 1;
      }
    });
    
    return Object.entries(monthCounts).map(([month, count]) => ({
      month,
      count
    }));
  };

  const exportCSV = () => {
    // Prepare data for export
    const clientsData = [
      ['Month', 'Number of Submissions'],
      ...monthlyStats.map(stat => [stat.month, stat.count])
    ];
    
    // Convert to CSV
    const csvContent = clientsData.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `submissions_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">ניתוח נתונים</h1>
        <Button onClick={exportCSV} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          ייצוא נתונים (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה״כ מנות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dishesCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה״כ קוקטיילים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cocktailsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">סה״כ משקאות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drinksCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 md:col-span-2">
        <CardHeader>
          <CardTitle>טפסים שהוגשו לפי חודש</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyStats}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="מספר טפסים" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                אין מספיק נתונים להצגת גרף
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionsAnalytics;
