import React, { useState } from "react";
import { useUnassignedSubmissions } from "@/hooks/useUnassignedSubmissions";
import { useAllEditors } from "@/hooks/useAllEditors";
import { SubmissionsQueueTable } from "@/components/admin/submissions-queue/SubmissionsQueueTable";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Submission } from "@/api/submissionApi";
import { toast } from "sonner";

const SubmissionsQueuePage: React.FC = () => {
  const { submissions, loading, refreshSubmissions } = useUnassignedSubmissions();
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const filteredSubmissions = priorityFilter === "all"
    ? submissions
    : submissions.filter(submission => submission.priority === priorityFilter);
  
  // Get unique priorities from submissions for the filter
  const uniquePriorities = Array.from(
    new Set(submissions.map(submission => submission.priority).filter(Boolean))
  );
  
  // Calculate stats
  const highPriorityCount = submissions.filter(s => s.priority === "High").length;
  const urgentSubmissions = submissions.filter(s => {
    const uploadDate = new Date(s.uploaded_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 3; // Submissions older than 3 days are considered urgent
  });

  return (
    <div className="container max-w-7xl mx-auto py-8" dir="rtl">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">תור הגשות לטיפול</h1>
          <p className="text-muted-foreground">
            הקצאת עבודות לעורכים ומעקב אחרי הגשות בתור
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סנן לפי עדיפות" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל העדיפויות</SelectItem>
              {uniquePriorities.map(priority => priority && (
                <SelectItem key={priority} value={priority}>{priority}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refreshSubmissions()}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הגשות בתור</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
            <p className="text-xs text-muted-foreground">
              הגשות ממתינות להקצאה
            </p>
          </CardContent>
        </Card>
        
        <Card className={highPriorityCount > 0 ? "border-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עדיפות גבוהה</CardTitle>
            <AlertCircle className={`h-4 w-4 ${highPriorityCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${highPriorityCount > 0 ? "text-amber-500" : ""}`}>
              {highPriorityCount}
            </div>
            <p className="text-xs text-muted-foreground">
              הגשות בעדיפות גבוהה
            </p>
          </CardContent>
        </Card>
        
        <Card className={urgentSubmissions.length > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הגשות דחופות</CardTitle>
            <Clock className={`h-4 w-4 ${urgentSubmissions.length > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${urgentSubmissions.length > 0 ? "text-red-500" : ""}`}>
              {urgentSubmissions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              הגשות מעל 3 ימים בתור
            </p>
          </CardContent>
        </Card>
      </div>

      <SubmissionsQueueTable 
        submissions={filteredSubmissions}
        loading={loading}
      />
    </div>
  );
};

export default SubmissionsQueuePage;
