
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Submission } from "@/api/submissionApi";
import { formatDate } from "@/utils/formatDate";

interface SubmissionsTabProps {
  submissions: Submission[];
  loading: boolean;
}

// Map submission status to appropriate badge color
const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "ממתינה לעיבוד":
      return "secondary";
    case "בעיבוד":
      return "warning";
    case "מוכנה להצגה":
      return "info";
    case "הערות התקבלו":
      return "default";
    case "הושלמה ואושרה":
      return "success";
    default:
      return "outline";
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

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({ submissions, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="w-full">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium">אין הגשות עדיין</h3>
        <p className="text-muted-foreground mt-2">
          ההגשות שלך יופיעו כאן לאחר שתגיש מנות, קוקטיילים או משקאות לעיבוד.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-muted/20 p-4 rounded-md mb-6">
        <p className="text-sm text-muted-foreground text-center">
          רשימת ההגשות שלך - סטטוס הגשות וההיסטוריה של עיבודים קודמים
        </p>
      </div>

      {submissions.map((submission) => (
        <Card key={submission.submission_id} className="w-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-md">{submission.item_name_at_submission}</CardTitle>
              <Badge variant={getStatusBadgeVariant(submission.submission_status)}>
                {submission.submission_status}
              </Badge>
            </div>
            <CardDescription>
              סוג: {getItemTypeText(submission.item_type)} | 
              הוגש בתאריך: {formatDate(submission.uploaded_at)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submission.processed_image_urls && submission.processed_image_urls.length > 0 ? (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">תמונות זמינות:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {submission.processed_image_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`עיבוד ${idx + 1} של ${submission.item_name_at_submission}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {submission.submission_status === "ממתינה לעיבוד" || submission.submission_status === "בעיבוד" 
                  ? "התמונות יהיו זמינות לאחר עיבוד."
                  : "אין תמונות זמינות."}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SubmissionsTab;
