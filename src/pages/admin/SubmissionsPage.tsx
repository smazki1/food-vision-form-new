
import React, { useState } from "react";
import { useAllSubmissions } from "@/hooks/useAllSubmissions";
import { SubmissionsTable } from "@/components/admin/submissions/SubmissionsTable";
import { Submission } from "@/types/models";
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

  // Transform API submissions to match our models type
  const transformedSubmissions: Submission[] = submissions.map(submission => ({
    submission_id: submission.submission_id,
    restaurant_name: submission.business_name || '',
    contact_name: '',
    phone: '',
    email: '',
    item_type: submission.item_type as 'dish' | 'cocktail' | 'drink',
    item_name: submission.item_name,
    description: submission.description,
    special_notes: submission.special_notes,
    image_urls: Array.isArray(submission.image_urls) ? submission.image_urls : [],
    status: submission.status as any,
    created_at: submission.created_at,
    created_lead_id: undefined
  }));

  // Filter submissions based on selected status
  const filteredSubmissions = statusFilter === "all"
    ? transformedSubmissions
    : transformedSubmissions.filter(submission => submission.status === statusFilter);

  const handleViewDetails = (submission: Submission) => {
    // In a real application, this would open a details modal or navigate to a details page
    console.log("View submission details:", submission);
  };

  // Get unique statuses from submissions for the filter
  const uniqueStatuses = Array.from(
    new Set(transformedSubmissions.map(submission => submission.status))
  );

  return (
    <div className="container max-w-7xl mx-auto py-8" dir="rtl">
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
