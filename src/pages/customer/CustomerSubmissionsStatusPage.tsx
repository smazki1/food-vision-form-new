import React from 'react';
import { Link } from 'react-router-dom';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission as ProcessedItem } from '@/api/submissionApi'; // Using the same type as in useSubmissions
import { Activity, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
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
    case "נדחתה": // Assuming a 'rejected' status
      return { icon: <XCircle className="h-4 w-4" />, style: "text-red-600 bg-red-100", hebrewStatus: "נדחתה" };
    case "דורש תיקונים": // Assuming a 'needs-revision' status
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
    default: return type; // Return original type if not matched
  }
};

const CustomerSubmissionsStatusPage: React.FC = () => {
  const { submissions, loading, error, refreshSubmissions } = useSubmissions();

  if (loading) {
    return <div dir="rtl" className="text-center p-10">טוען הגשות...</div>;
  }

  if (error) {
    return (
      <div dir="rtl" className="text-center p-10 text-red-500">
        שגיאה בטעינת ההגשות: {error.message}
        <Button onClick={refreshSubmissions} className="mt-4">נסה שוב</Button>
      </div>
    );
  }

  const sortedSubmissions = React.useMemo(() => {
    if (!submissions) return [];
    return [...submissions].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }, [submissions]);

  return (
    <div dir="rtl" className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">סטטוס הגשות</h1>
        <Button asChild>
            <Link to="/customer/new-submission">הוסף הגשה חדשה</Link>
        </Button>
      </div>

      {sortedSubmissions.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          <p>לא נמצאו הגשות.</p>
          <p>עדיין לא העלית פריטים? <Link to="/customer/new-submission" className="text-primary hover:underline">התחל עכשיו!</Link></p>
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
                       {/* Link to submission details page, once created */}
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