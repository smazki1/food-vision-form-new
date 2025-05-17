
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface PackageUtilizationProps {
  data: Array<{
    package_id: string;
    package_name: string;
    client_count: number;
    avg_remaining: number;
  }>;
  loading: boolean;
}

export function PackageUtilization({ data, loading }: PackageUtilizationProps) {
  const navigate = useNavigate();
  
  // Sort packages by client count (popularity)
  const sortedData = [...data].sort((a, b) => b.client_count - a.client_count);

  // Function to normalize avg remaining servings to a percentage
  // We'll assume 20 servings is max for visualization purposes
  const getProgressValue = (avgRemaining: number) => {
    const maxServings = 20;
    return Math.min((avgRemaining / maxServings) * 100, 100);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">ניצול חבילות</CardTitle>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0" 
          onClick={() => navigate("/admin/packages")}
        >
          ניהול חבילות <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : sortedData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>חבילה</TableHead>
                <TableHead className="text-right">מספר לקוחות</TableHead>
                <TableHead className="text-right">מנות נותרו (ממוצע)</TableHead>
                <TableHead className="text-right">שימוש</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((pkg) => (
                <TableRow key={pkg.package_id}>
                  <TableCell>{pkg.package_name}</TableCell>
                  <TableCell className="text-right">{pkg.client_count}</TableCell>
                  <TableCell className="text-right">{pkg.avg_remaining.toFixed(1)}</TableCell>
                  <TableCell className="w-[120px]">
                    <div className="flex items-center">
                      <Progress 
                        value={getProgressValue(pkg.avg_remaining)} 
                        className="h-2 bg-blue-100" 
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <p className="text-muted-foreground">אין נתוני חבילות להצגה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
