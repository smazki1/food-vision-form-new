import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Package, Users, TrendingUp } from "lucide-react";
import { useAdminClientStats, ClientSubmissionStats } from "@/hooks/useAdminClientStats";
import { Progress } from "@/components/ui/progress";

const statusColors = {
  "ממתינה לעיבוד": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "בעיבוד": "bg-blue-100 text-blue-800 border-blue-200",
  "מוכנה להצגה": "bg-purple-100 text-purple-800 border-purple-200",
  "הערות התקבלו": "bg-orange-100 text-orange-800 border-orange-200",
  "הושלמה ואושרה": "bg-green-100 text-green-800 border-green-200"
};

const statusDisplayNames = {
  "ממתינה לעיבוד": "ממתינות",
  "בעיבוד": "בעיבוד",
  "מוכנה להצגה": "מוכנות",
  "הערות התקבלו": "בתיקונים",
  "הושלמה ואושרה": "הושלמו"
};

export function ClientSubmissionStatsOverview() {
  const navigate = useNavigate();
  const { clientStats, loading, error } = useAdminClientStats();

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>סטטיסטיקות הגשות לקוחות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>סטטיסטיקות הגשות לקוחות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-muted-foreground">שגיאה בטעינת הנתונים</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall statistics
  const totalClients = clientStats.length;
  const totalSubmissions = clientStats.reduce((sum, client) => sum + client.total_submissions, 0);
  const activeClients = clientStats.filter(client => client.total_submissions > 0).length;

  // Calculate overall status counts
  const overallStatusCounts = clientStats.reduce((acc, client) => {
    Object.entries(client.statusCounts).forEach(([status, count]) => {
      acc[status] = (acc[status] || 0) + count;
    });
    return acc;
  }, {} as Record<string, number>);

  // Top 5 most active clients
  const topClients = clientStats.slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">סטטיסטיקות הגשות לקוחות</CardTitle>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0" 
          onClick={() => navigate("/admin/clients")}
        >
          כל הלקוחות <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600 ml-1" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalClients}</div>
            <div className="text-sm text-gray-600">סה"כ לקוחות</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600 ml-1" />
            </div>
            <div className="text-2xl font-bold text-green-600">{activeClients}</div>
            <div className="text-sm text-gray-600">לקוחות פעילים</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Package className="h-5 w-5 text-purple-600 ml-1" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{totalSubmissions}</div>
            <div className="text-sm text-gray-600">סה"כ הגשות</div>
          </div>
        </div>

        {/* Overall Status Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">התפלגות סטטוסים</h4>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            {Object.entries(overallStatusCounts).map(([status, count]) => (
              <div key={status} className="text-center">
                <Badge 
                  className={`${statusColors[status as keyof typeof statusColors]} text-xs px-2 py-1 mb-1`}
                >
                  {statusDisplayNames[status as keyof typeof statusDisplayNames]}
                </Badge>
                <div className="text-lg font-semibold">{count}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Active Clients */}
        {topClients.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">לקוחות פעילים (5 הראשונים)</h4>
            <div className="space-y-3">
              {topClients.map((client) => {
                const completionRate = client.total_servings 
                  ? ((client.total_servings - client.remaining_servings) / client.total_servings) * 100 
                  : 0;
                
                return (
                  <div key={client.client_id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-medium text-sm">{client.restaurant_name}</h5>
                        <p className="text-xs text-gray-500">
                          {client.package_name || 'ללא חבילה'} • {client.total_submissions} הגשות
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{client.remaining_servings}</div>
                        <div className="text-xs text-gray-500">מנות נותרו</div>
                      </div>
                    </div>
                    
                    {/* Status breakdown for this client */}
                    <div className="flex gap-1 mb-2">
                      {Object.entries(client.statusCounts).map(([status, count]) => 
                        count > 0 && (
                          <Badge 
                            key={status}
                            className={`${statusColors[status as keyof typeof statusColors]} text-xs`}
                          >
                            {count}
                          </Badge>
                        )
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {client.total_servings && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>התקדמות חבילה</span>
                          <span>{Math.round(completionRate)}%</span>
                        </div>
                        <Progress value={completionRate} className="h-2" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalClients === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">אין לקוחות פעילים כרגע</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 