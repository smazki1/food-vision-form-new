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
  const { submissions: rawSubmissions, loading, refreshSubmissions } = useUnassignedSubmissions();
  const submissions = rawSubmissions || []; // Ensure submissions is always an array
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const filteredSubmissions = priorityFilter === "all"
    ? submissions // Already an array or empty array
    : submissions.filter(submission => submission.priority === priorityFilter);
  
  // Get unique priorities from submissions for the filter
  const uniquePriorities = Array.from(
    new Set(submissions.map(submission => submission.priority).filter(Boolean))
  );
  
  // Calculate stats
  const highPriorityCount = submissions.filter(s => s.priority === "High").length;
  const urgentSubmissionsArray = submissions.filter(s => {
    if (!s.uploaded_at) return false; // Guard against missing uploaded_at for date parsing
    try {
      const uploadDate = new Date(s.uploaded_at);
      if (isNaN(uploadDate.getTime())) return false; // Check for Invalid Date
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 3;
    } catch (e) {
      console.error("Error parsing uploaded_at date:", e);
      return false;
    }
  });
  const urgentSubmissionsCount = urgentSubmissionsArray.length;

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
            aria-label="Refresh submissions"
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
        
        <Card className={urgentSubmissionsCount > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הגשות דחופות</CardTitle>
            <Clock className={`h-4 w-4 ${urgentSubmissionsCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${urgentSubmissionsCount > 0 ? "text-red-500" : ""}`}>
              {urgentSubmissionsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              הגשות מעל 3 ימים בתור
            </p>
          </CardContent>
        </Card>
      </div>

      <SubmissionsQueueTable 
        submissions={filteredSubmissions} // This is now guaranteed to be an array
        loading={loading}
      />
    </div>
  );
};

export default SubmissionsQueuePage;
