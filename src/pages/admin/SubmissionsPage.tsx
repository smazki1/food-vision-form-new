
import React, { useState } from "react";
import { useAllSubmissions } from "@/hooks/useAllSubmissions";
import { SubmissionsTable } from "@/components/admin/submissions/SubmissionsTable";
import { Submission } from "@/api/submissionApi";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SubmissionsPage: React.FC = () => {
  const { submissions, loading, refreshSubmissions } = useAllSubmissions();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Filter submissions based on selected status
  const filteredSubmissions = statusFilter === "all"
    ? submissions
    : submissions.filter(submission => submission.submission_status === statusFilter);

  const handleViewDetails = (submission: Submission) => {
    // In a real application, this would open a details modal or navigate to a details page
    console.log("View submission details:", submission);
  };

  // Get unique statuses from submissions for the filter
  const uniqueStatuses = Array.from(
    new Set(submissions.map(submission => submission.submission_status))
  );

  return (
    <div className="container mx-auto py-8" dir="rtl">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">הגשות</h1>
          <p className="text-muted-foreground">
            ניהול וצפייה בהגשות של לקוחות
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="סנן לפי סטטוס" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">כל הסטטוסים</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
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

      <SubmissionsTable 
        submissions={filteredSubmissions}
        loading={loading}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
};

export default SubmissionsPage;
