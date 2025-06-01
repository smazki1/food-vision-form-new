import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Building2, User } from "lucide-react";
import { Submission } from "@/types/models";

interface SubmissionsTableProps {
  submissions: Submission[];
  loading: boolean;
  onViewDetails: (submission: Submission) => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  submissions,
  loading,
  onViewDetails,
}) => {
  const navigate = useNavigate();

  const handleViewSubmission = (submissionId: string) => {
    navigate(`/admin/submissions/${submissionId}`);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "הושלמה ואושרה":
        return "default";
      case "בעיבוד":
        return "secondary";
      case "ממתינה לעיבוד":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "High":
      case "Urgent":
        return "destructive";
      case "Medium":
        return "secondary";
      case "Low":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>פריט</TableHead>
            <TableHead>מסעדה</TableHead>
            <TableHead>סטטוס</TableHead>
            <TableHead>עדיפות</TableHead>
            <TableHead>תאריך העלאה</TableHead>
            <TableHead>פעולות</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                לא נמצאו הגשות
              </TableCell>
            </TableRow>
          ) : (
            submissions.map((submission) => (
              <TableRow key={submission.submission_id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{submission.item_name}</div>
                    <div className="text-sm text-muted-foreground">{submission.item_type}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {submission.created_lead_id ? (
                      <>
                        <User className="h-4 w-4 text-blue-600" />
                        <span>ליד חדש</span>
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 text-gray-400" />
                        <span>לא מקושר</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {submission.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    Medium
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(submission.created_at).toLocaleDateString('he-IL')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubmission(submission.submission_id)}
                  >
                    <Eye className="h-4 w-4 ml-2" />
                    צפה
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
