
import React from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface SubmissionsTabProps {
  submissions: Submission[];
  loading?: boolean;
}

// Function to get appropriate badge variant based on status
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ממתינה לעיבוד":
      return "warning" as const;
    case "בעיבוד":
      return "blue" as const;
    case "מוכנה להצגה":
      return "success" as const;
    case "הערות התקבלו":
      return "purple" as const;
    case "הושלמה ואושרה":
      return "secondary" as const;
    default:
      return "default" as const;
  }
};

// Function to get Hebrew item type name
const getItemTypeDisplay = (type: string): string => {
  switch (type) {
    case "dish":
      return "מנה";
    case "cocktail":
      return "קוקטייל";
    case "drink":
      return "משקה";
    default:
      return type;
  }
};

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ submissions, loading = false }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium mb-4">הגשות קודמות</h3>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">אין לך הגשות קודמות</p>
        <p className="text-muted-foreground mt-2">הגש מנות חדשות כדי לראות אותן כאן</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-4">הגשות קודמות</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם פריט</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>תאריך העלאה</TableHead>
              <TableHead>סטטוס</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.submission_id}>
                <TableCell className="font-medium">{submission.item_name_at_submission}</TableCell>
                <TableCell>{getItemTypeDisplay(submission.item_type)}</TableCell>
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
    </div>
  );
};

export default SubmissionsTab;
