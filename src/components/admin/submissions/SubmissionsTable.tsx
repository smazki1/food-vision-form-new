
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/utils/formatDate";
import { Submission } from "@/api/submissionApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SubmissionsTableProps {
  submissions: Submission[];
  loading?: boolean;
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ממתינה לעיבוד":
      return "warning";
    case "בעיבוד":
      return "blue";
    case "מוכנה להצגה":
      return "success";
    case "הערות התקבלו":
      return "purple";
    case "הושלמה ואושרה":
      return "secondary";
    default:
      return "default";
  }
};

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({ submissions, loading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  if (loading) {
    return <p>טוען הגשות...</p>;
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch = submission.item_name_at_submission?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.clients?.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? submission.submission_status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  const uniqueStatuses = [...new Set(submissions.map(sub => sub.submission_status))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2 md:items-center justify-between">
        <Input
          placeholder="חיפוש לפי שם פריט/מסעדה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!statusFilter ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            הכל
          </Button>
          {uniqueStatuses.map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "secondary" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          לא נמצאו הגשות מתאימות לחיפוש שלך
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>פריט</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>מסעדה</TableHead>
                <TableHead>תאריך העלאה</TableHead>
                <TableHead>סטטוס</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.submission_id}>
                  <TableCell className="font-medium">{submission.item_name_at_submission}</TableCell>
                  <TableCell>{submission.item_type === "dish" ? "מנה" : 
                            submission.item_type === "cocktail" ? "קוקטייל" : "משקה"}</TableCell>
                  <TableCell>{submission.clients?.restaurant_name}</TableCell>
                  <TableCell dir="ltr" className="text-right">{formatDate(submission.uploaded_at)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(submission.submission_status)}>
                      {submission.submission_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
