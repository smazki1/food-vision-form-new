
import React from "react";
import { formatDate } from "@/utils/formatDate";
import { Clock, Check, Eye, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Submission, SubmissionStatus } from "@/api/submissionApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface SubmissionSidebarProps {
  submission: Submission;
  maxEdits: number;
  onStatusChange: (status: string) => void;
  isUpdating: boolean;
}

const SubmissionSidebar: React.FC<SubmissionSidebarProps> = ({ 
  submission, 
  maxEdits,
  onStatusChange, 
  isUpdating 
}) => {
  const navigate = useNavigate();
  
  const deadlineDate = submission.target_completion_date ? 
    new Date(submission.target_completion_date) : null;
  const isOverdue = deadlineDate && deadlineDate < new Date();
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "ממתינה לעיבוד": return "warning";
      case "בעיבוד": return "blue";
      case "מוכנה להצגה": return "success";
      case "הערות התקבלו": return "purple";
      case "הושלמה ואושרה": return "secondary";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי המשימה</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">סוג פריט:</h4>
            <p>
              {submission.item_type === "dish" ? "מנה" : 
               submission.item_type === "cocktail" ? "קוקטייל" : "משקה"}
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">תאריך העלאה:</h4>
            <p>{formatDate(submission.uploaded_at)}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">דדליין להשלמה:</h4>
            <div className="flex items-center gap-1">
              <Clock className={`h-4 w-4 ${isOverdue ? "text-red-500" : ""}`} />
              <p className={isOverdue ? "text-red-500 font-medium" : ""}>
                {submission.target_completion_date ? 
                  formatDate(submission.target_completion_date) : 
                  "לא הוגדר"}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">עדיפות:</h4>
            <Badge variant={submission.priority === "High" ? "destructive" : 
                         submission.priority === "Low" ? "green" : "yellow"}>
              {submission.priority || "Medium"}
            </Badge>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">מספר עריכות:</h4>
            <p>{submission.edit_count || 0} / {maxEdits}</p>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="text-sm font-medium mb-2">עדכן סטטוס:</h4>
            <Select
              value={submission.submission_status}
              onValueChange={onStatusChange}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר סטטוס" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ממתינה לעיבוד">ממתינה לעיבוד</SelectItem>
                <SelectItem value="בעיבוד">בעיבוד</SelectItem>
                <SelectItem value="מוכנה להצגה">מוכנה להצגה</SelectItem>
                <SelectItem value="זקוק לבדיקת מנהל">זקוק לבדיקת מנהל</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            className="w-full"
            disabled={submission.submission_status === "מוכנה להצגה"}
            onClick={() => onStatusChange("מוכנה להצגה")}
          >
            <Check className="h-4 w-4 mr-1" />
            סמן כ"מוכנה להצגה"
          </Button>
        </CardFooter>
      </Card>
      
      {/* Client profile link and communication section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            מידע נוסף
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">פרופיל הלקוח:</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/clients/${submission.client_id}`)}
              className="w-full"
            >
              <Eye className="h-4 w-4 mr-1" />
              צפייה בפרופיל הלקוח
            </Button>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-1">פרטי הפריט המקורי:</h4>
            <Button
              variant="outline"
              size="sm"
              disabled={!submission.original_item_id}
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-1" />
              צפייה בפריט המקורי
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionSidebar;
