
import React from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import { Calendar, Edit, Clock, AlertCircle } from "lucide-react";
import { Submission } from "@/api/submissionApi";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMaxEdits } from "../hooks/useMaxEdits";

interface ProcessingInfoTabProps {
  submission: Submission;
}

export const ProcessingInfoTab: React.FC<ProcessingInfoTabProps> = ({ submission }) => {
  const { maxEdits, currentEditCount } = useMaxEdits(submission);
  
  // Calculate days remaining until target completion date
  const daysRemaining = submission.target_completion_date 
    ? differenceInDays(new Date(submission.target_completion_date), new Date())
    : null;
    
  const isOverdue = daysRemaining !== null && daysRemaining < 0;
  const isNearDeadline = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 1;
  
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
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">מידע לעיבוד</h3>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={isOverdue ? "border-red-500" : isNearDeadline ? "border-amber-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תאריך יעד להשלמה</CardTitle>
            <Calendar className={`h-4 w-4 ${
              isOverdue ? "text-red-500" : 
              isNearDeadline ? "text-amber-500" : 
              "text-muted-foreground"
            }`} />
          </CardHeader>
          <CardContent>
            {submission.target_completion_date ? (
              <>
                <div className={`text-xl font-bold ${
                  isOverdue ? "text-red-500" : 
                  isNearDeadline ? "text-amber-500" : ""
                }`}>
                  {format(parseISO(submission.target_completion_date), "dd/MM/yyyy")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {isOverdue ? (
                    <span className="text-red-500 font-medium">
                      באיחור של {Math.abs(daysRemaining!)} ימים
                    </span>
                  ) : (
                    `${daysRemaining} ימים נותרו`
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="text-xl font-bold">לא מוגדר</div>
                <p className="text-xs text-muted-foreground">לא נקבע תאריך יעד</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">עריכות</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {currentEditCount} / {maxEdits}
            </div>
            <p className="text-xs text-muted-foreground">
              עריכות שנוצלו מתוך מכסה
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>פרטי משימה</CardTitle>
          <CardDescription>
            מידע כללי על המשימה והלקוח
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-muted-foreground">עדיפות:</span>
            <Badge variant={getPriorityBadgeVariant(submission.priority)}>
              {submission.priority || "Medium"}
            </Badge>
          </div>
          
          <div>
            <span className="text-muted-foreground">סוג פריט:</span>
            <span className="mr-2">{submission.item_type === "dish" ? "מנה" : 
                                    submission.item_type === "cocktail" ? "קוקטייל" : "משקה"}</span>
          </div>
          
          <div>
            <span className="text-muted-foreground">תאריך העלאה:</span>
            <span className="mr-2">
              {format(parseISO(submission.uploaded_at), "dd/MM/yyyy")}
            </span>
          </div>
          
          {submission.assigned_package_id_at_submission && (
            <div>
              <span className="text-muted-foreground">חבילה:</span>
              <span className="mr-2">{submission.assigned_package_id_at_submission}</span>
            </div>
          )}
          
          {submission.internal_team_notes && (
            <div>
              <span className="text-muted-foreground">הערות פנימיות:</span>
              <p className="mt-1 text-sm border-r-2 border-muted pr-2">
                {submission.internal_team_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
