
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SubmissionQueueProps {
  data: { status: string; count: number }[];
  totalOverdue: number;
  loading: boolean;
}

export function SubmissionQueue({
  data,
  totalOverdue,
  loading,
}: SubmissionQueueProps) {
  const navigate = useNavigate();
  
  // Define the order of submission statuses for display
  const statusOrder = [
    "ממתינה לעיבוד",
    "בעיבוד",
    "מוכנה להצגה",
    "הערות התקבלו",
    "הושלמה ואושרה",
  ];
  
  // Sort the data by the defined order
  const sortedData = [...data].sort((a, b) => {
    return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
  });

  // Colors for different submission statuses
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ממתינה לעיבוד":
        return "bg-amber-500";
      case "בעיבוד":
        return "bg-blue-500";
      case "מוכנה להצגה":
        return "bg-purple-500";
      case "הערות התקבלו":
        return "bg-orange-500";
      case "הושלמה ואושרה":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get icon based on status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ממתינה לעיבוד":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "בעיבוד":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "מוכנה להצגה":
        return <CheckCircle2 className="h-4 w-4 text-purple-500" />;
      case "הערות התקבלו":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "הושלמה ואושרה":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Calculate total submissions for percentage calculation
  const totalSubmissions = data.reduce((total, item) => total + item.count, 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-medium">מנות בעיבוד</CardTitle>
        <Button 
          variant="link" 
          size="sm" 
          className="px-0" 
          onClick={() => navigate("/admin/queue")}
        >
          תור הגשות <ArrowRight className="mr-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="text-muted-foreground">טוען נתונים...</span>
          </div>
        ) : sortedData.length > 0 ? (
          <div className="space-y-4">
            {/* Status breakdown */}
            <div className="space-y-5">
              {sortedData
                .filter(item => item.status !== "הושלמה ואושרה") // Exclude completed items
                .map((item) => {
                  const percentage = totalSubmissions ? (item.count / totalSubmissions) * 100 : 0;
                  
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(item.status)}
                          <span>{item.status}</span>
                        </div>
                        <span className="text-muted-foreground">{item.count} מנות</span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className={`h-2 bg-gray-100`} 
                      />
                    </div>
                  );
              })}
            </div>
            
            {/* Overdue warning */}
            {totalOverdue > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 mt-4">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p><strong>{totalOverdue} מנות</strong> חורגות מתאריך היעד</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">אין מנות בעיבוד כרגע</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
