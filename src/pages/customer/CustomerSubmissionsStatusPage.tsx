
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSubmissions } from '@/hooks/useSubmissions';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { Submission as ProcessedItem } from '@/api/submissionApi';
import { Activity, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Export the helper function for use in other components
export const getStatusIconAndStyle = (status?: string): { icon: JSX.Element | null, style: string, hebrewStatus: string } => {
  switch (status) {
    case "ממתינה לעיבוד":
      return { icon: <Activity className="h-4 w-4" />, style: "text-yellow-600 bg-yellow-100", hebrewStatus: "ממתינה לעיבוד" };
    case "בעיבוד":
      return { icon: <Activity className="h-4 w-4" />, style: "text-blue-600 bg-blue-100", hebrewStatus: "בעיבוד" };
    case "מוכנה להצגה":
    case "הושלמה ואושרה":
      return { icon: <CheckCircle2 className="h-4 w-4" />, style: "text-green-600 bg-green-100", hebrewStatus: "הושלמה" };
    case "נדחתה":
      return { icon: <XCircle className="h-4 w-4" />, style: "text-red-600 bg-red-100", hebrewStatus: "נדחתה" };
    case "דורש תיקונים":
        return { icon: <AlertCircle className="h-4 w-4" />, style: "text-orange-600 bg-orange-100", hebrewStatus: "דורש תיקונים" };
    default:
      return { icon: null, style: "text-gray-600 bg-gray-100", hebrewStatus: status || "לא ידוע" };
  }
};

// Export the helper function
export const getItemTypeName = (type: string | undefined) => {
  if (!type) return 'לא ידוע';
  switch (type) {
    case 'dish': return 'מנה';
    case 'cocktail': return 'קוקטייל';
    case 'drink': return 'משקה';
    default: return type;
  }
};

const CustomerSubmissionsStatusPage: React.FC = () => {
  const { 
    submissions, 
    loading: submissionsLoading,
    clientLoading: authLoading,
    error,
    refreshSubmissions, 
    clientId: effectiveClientId,
    isAuthenticated: effectiveAuthenticated
  } = useSubmissions();
  
  const { user: unifiedUser } = useUnifiedAuth();

  console.log("[CustomerSubmissionsStatusPage] Component state:", {
    effectiveClientId,
    effectiveAuthenticated,
    authLoading,
    submissionsLoading,
    unifiedUser: unifiedUser?.id,
    submissionsCount: submissions?.length,
    error: error?.message,
    timestamp: Date.now()
  });

  // Use useMemo to safely sort submissions and prevent React error #310
  const sortedSubmissions = useMemo(() => {
    if (!submissions || !Array.isArray(submissions)) {
      console.warn("[CustomerSubmissionsStatusPage] Invalid submissions data:", submissions);
      return [];
    }
    try {
      return [...submissions].sort((a, b) => {
        const dateA = new Date(a.uploaded_at).getTime();
        const dateB = new Date(b.uploaded_at).getTime();
        return dateB - dateA;
      });
    } catch (err) {
      console.error("[CustomerSubmissionsStatusPage] Error sorting submissions:", err);
      return submissions;
    }
  }, [submissions]);

  if (authLoading || submissionsLoading || (!effectiveClientId && effectiveAuthenticated)) {
    return (
      <div dir="rtl" className="text-center p-10">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          טוען הגשות...
        </div>
      </div>
    );
  }

  if (!effectiveAuthenticated) {
    return (
      <div dir="rtl" className="text-center p-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            יש להיות מחובר כדי לצפות בהגשות
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!effectiveClientId) {
    return (
      <div dir="rtl" className="text-center p-10">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            לא נמצא פרופיל לקוח מקושר לחשבון זה
          </AlertDescription>
        </Alert>
        <div className="mt-4 text-sm text-gray-600">
          <p>פרטי דיבוג:</p>
          <p>משתמש: {unifiedUser?.id}</p>
          <p>לקוח מאוחד (מ-useSubmissions): {effectiveClientId || 'לא נמצא'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div dir="rtl" className="text-center p-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            שגיאה בטעינת ההגשות: {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={refreshSubmissions} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4 ml-2" />
          נסה שוב
        </Button>
      </div>
    );
  }

  return (
    <div dir="rtl" className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">סטטוס הגשות</h1>
        <div className="flex gap-2">
          <Button onClick={refreshSubmissions} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            רענן
          </Button>
          <Button asChild>
            <Link to="/customer/upload">הוסף הגשה חדשה</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Alert>
          <AlertDescription>
            מציג הגשות עבור לקוח ID: {effectiveClientId}
            <br />
            משתמש: {unifiedUser?.email}
            <br />
            סה"כ הגשות נמצאו: {sortedSubmissions?.length || 0}
          </AlertDescription>
        </Alert>
      </div>

      {sortedSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>לא נמצאו הגשות עבור לקוח זה.</p>
          <p>עדיין לא העלית פריטים? <Link to="/customer/upload" className="text-primary hover:underline">התחל עכשיו!</Link></p>
          <div className="mt-4 text-sm">
            <p>מידע דיבוג:</p>
            <p>לקוח ID: {effectiveClientId}</p>
            <p>משתמש ID: {unifiedUser?.id}</p>
            <p>מאומת: {effectiveAuthenticated ? 'כן' : 'לא'}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">שם הפריט</TableHead>
                <TableHead>סוג</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="text-right">תאריך העלאה</TableHead>
                <TableHead className="text-right">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubmissions.map((item: ProcessedItem) => {
                const statusInfoLocal = getStatusIconAndStyle(item.submission_status);
                return (
                  <TableRow key={item.submission_id}>
                    <TableCell className="font-medium truncate" title={item.item_name_at_submission}>{item.item_name_at_submission}</TableCell>
                    <TableCell>{getItemTypeName(item.item_type)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent ${statusInfoLocal.style}`}>
                        {statusInfoLocal.icon}
                        <span className="ml-2">{statusInfoLocal.hebrewStatus}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{new Date(item.uploaded_at).toLocaleDateString('he-IL')}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="link" className="p-0 h-auto text-primary">
                        <Link to={`/customer/submissions/${item.submission_id}`}>פרטים</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default CustomerSubmissionsStatusPage;
