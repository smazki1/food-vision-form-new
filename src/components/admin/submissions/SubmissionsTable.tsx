
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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, Filter } from "lucide-react";
import { Submission } from "@/api/submissionApi";
import { formatDate } from "@/utils/formatDate";

interface SubmissionsTableProps {
  submissions: Submission[];
  loading: boolean;
  onViewDetails?: (submission: Submission) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "ממתינה לעיבוד":
      return <Badge variant="secondary">{status}</Badge>;
    case "בעיבוד":
      return <Badge variant="warning">{status}</Badge>;
    case "מוכנה להצגה":
      return <Badge variant="info">{status}</Badge>;
    case "הערות התקבלו":
      return <Badge variant="default">{status}</Badge>;
    case "הושלמה ואושרה":
      return <Badge variant="success">{status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

// Map item type to Hebrew display text
const getItemTypeText = (type: string) => {
  switch (type) {
    case "dish":
      return "מנה";
    case "cocktail":
      return "קוקטייל";
    case "drink":
      return "משקה";
    default:
      return "פריט";
  }
};

const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  loading,
  onViewDetails
}) => {
  const [sortColumn, setSortColumn] = useState<string>("uploaded_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Sort submissions based on selected column and direction
  const sortedSubmissions = [...submissions].sort((a, b) => {
    let comparison = 0;
    switch (sortColumn) {
      case "item_name_at_submission":
        comparison = a.item_name_at_submission.localeCompare(b.item_name_at_submission);
        break;
      case "item_type":
        comparison = a.item_type.localeCompare(b.item_type);
        break;
      case "submission_status":
        comparison = a.submission_status.localeCompare(b.submission_status);
        break;
      case "uploaded_at":
      default:
        comparison = new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>שם פריט</TableHead>
              <TableHead>סוג</TableHead>
              <TableHead>סטטוס</TableHead>
              <TableHead>תאריך העלאה</TableHead>
              <TableHead>פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="text-center p-8 border rounded-md">
        <h3 className="text-lg font-medium">לא נמצאו הגשות</h3>
        <p className="text-muted-foreground mt-2">
          לא קיימות הגשות במערכת.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("item_name_at_submission")} className="cursor-pointer">
              שם פריט {sortColumn === "item_name_at_submission" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("item_type")} className="cursor-pointer">
              סוג {sortColumn === "item_type" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("submission_status")} className="cursor-pointer">
              סטטוס {sortColumn === "submission_status" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead onClick={() => handleSort("uploaded_at")} className="cursor-pointer">
              תאריך העלאה {sortColumn === "uploaded_at" && (sortDirection === "asc" ? "↑" : "↓")}
            </TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubmissions.map((submission) => (
            <TableRow key={submission.submission_id}>
              <TableCell className="font-medium">{submission.item_name_at_submission}</TableCell>
              <TableCell>{getItemTypeText(submission.item_type)}</TableCell>
              <TableCell>{getStatusBadge(submission.submission_status)}</TableCell>
              <TableCell dir="ltr" className="text-right">{formatDate(submission.uploaded_at)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewDetails && onViewDetails(submission)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default SubmissionsTable;
