
import React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Submission } from "@/api/submissionApi";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditorAssignmentCell } from "./EditorAssignmentCell";

interface SubmissionsQueueTableProps {
  submissions: Submission[];
  loading: boolean;
}

export const SubmissionsQueueTable: React.FC<SubmissionsQueueTableProps> = ({
  submissions,
  loading,
}) => {
  const getPriorityBadgeVariant = (priority: string | null) => {
    switch (priority) {
      case "High":
        return "destructive";
      case "Medium":
        return "yellow";
      case "Low":
        return "green";
      default:
        return "secondary";
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">טוען הגשות...</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">אין הגשות בתור כרגע</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>פריט</TableHead>
            <TableHead>מסעדה</TableHead>
            <TableHead>זמן בתור</TableHead>
            <TableHead>עדיפות</TableHead>
            <TableHead>הקצאה לעורך</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const timeInQueue = formatDistanceToNow(parseISO(submission.uploaded_at), {
              addSuffix: true,
              locale: he,
            });
            
            // Check if the submission has been in queue for more than 3 days
            const isUrgent = new Date().getTime() - new Date(submission.uploaded_at).getTime() > 
                            3 * 24 * 60 * 60 * 1000;
            
            return (
              <TableRow key={submission.submission_id}>
                <TableCell className="font-medium">
                  {submission.item_name_at_submission}
                </TableCell>
                <TableCell>{submission.clients?.restaurant_name}</TableCell>
                <TableCell className={isUrgent ? "text-red-500 font-medium" : ""}>
                  {timeInQueue}
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(submission.priority)}>
                    {submission.priority || "Medium"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <EditorAssignmentCell 
                    submissionId={submission.submission_id} 
                    currentEditorId={submission.assigned_editor_id} 
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
