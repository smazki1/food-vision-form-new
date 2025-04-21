
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalClients: 0,
    totalDishes: 0,
    totalCocktails: 0,
    totalDrinks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get counts from each table
        const [clientsRes, dishesRes, cocktailsRes, drinksRes] = await Promise.all([
          supabase.from("clients").select("client_id", { count: "exact", head: true }),
          supabase.from("dishes").select("dish_id", { count: "exact", head: true }),
          supabase.from("cocktails").select("cocktail_id", { count: "exact", head: true }),
          supabase.from("drinks").select("drink_id", { count: "exact", head: true }),
        ]);

        setStats({
          totalClients: clientsRes.count || 0,
          totalDishes: dishesRes.count || 0,
          totalCocktails: cocktailsRes.count || 0,
          totalDrinks: drinksRes.count || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const StatCard = ({ title, value, loading }: { title: string; value: number; loading: boolean }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">דאשבורד</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="סה״כ לקוחות" value={stats.totalClients} loading={loading} />
        <StatCard title="סה״כ מנות" value={stats.totalDishes} loading={loading} />
        <StatCard title="סה״כ קוקטיילים" value={stats.totalCocktails} loading={loading} />
        <StatCard title="סה״כ משקאות" value={stats.totalDrinks} loading={loading} />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>פעילות אחרונה</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <p className="text-muted-foreground">לוח פעילות אחרונה יוצג כאן.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
