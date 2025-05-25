import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Image as ImageIcon, Activity, CheckCircle2, XCircle, Home as HomeIcon, ListChecks as ListChecksIcon, UserCircle as UserCircleIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useSubmissions } from '@/hooks/useSubmissions';
import { Submission as ProcessedItem } from '@/api/submissionApi';
import { UnifiedAuthContext } from '@/contexts/UnifiedAuthContext';
import { useClientPackage, PackageDetails as ClientPackageDetails } from '@/hooks/useClientPackage';

// DisplayItem can be simplified or merged if ProcessedItem is directly usable
interface DisplayItem {
  id: string; // This will be submission_id from ProcessedItem
  name: string; // item_name_at_submission
  type: string; // item_type
  imageUrl?: string; // main_processed_image_url or first from processed_image_urls
  status?: string; // submission_status
  uploadedAt: string; // uploaded_at
}

const CustomerHome: React.FC = () => {
  const { user } = useContext(UnifiedAuthContext);
  const { submissions, loading, error } = useSubmissions();
  const clientPackage = useClientPackage();
  const location = useLocation();

  // Mock package data - replace with actual data from context or hook
  // const currentPackage: PackageDetails = {
  //   name: "חבילת טסט של לקוח ראשון",
  //   remainingServings: 45,
  //   totalServings: 85,
  //   detailsLink: "/customer/package-details", // Example link
  // };

  const displayItems: DisplayItem[] = React.useMemo(() => {
    if (!submissions) return [];
    
    return submissions.map((item: ProcessedItem) => ({
      id: item.submission_id,
      name: item.item_name_at_submission,
      type: item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1),
      imageUrl: item.main_processed_image_url || (item.processed_image_urls && item.processed_image_urls.length > 0 ? item.processed_image_urls[0] : undefined),
      status: item.submission_status,
      uploadedAt: item.uploaded_at,
    })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [submissions]);

  const submissionStatusCounts = React.useMemo(() => {
    if (!submissions) return {};
    return submissions.reduce((acc, item) => {
      const status = item.submission_status || 'לא ידוע';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [submissions]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "ממתינה לעיבוד":
      case "בעיבוד":
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case "מוכנה להצגה":
      case "הושלמה ואושרה":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Loading and error states should ideally be handled more gracefully,
  // perhaps with skeletons or more integrated messages within the new layout sections.
  if (loading) {
    return <div dir="rtl" className="flex justify-center items-center h-screen">טוען נתונים...</div>;
  }

  if (error) {
    return <div dir="rtl" className="p-4 md:p-8 text-center text-red-500">שגיאה בטעינת הנתונים: {error.message}</div>;
  }

  return (
    <div dir="rtl" className="flex flex-col min-h-screen p-4 md:p-6 lg:p-8 pb-24 sm:pb-8">
      {/* 1. שלום, [שם המשתמש] */}
      <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 md:mb-8">
        שלום, {user?.user_metadata?.full_name || user?.email || 'לקוח'}
      </h1>

      {/* 2. סטטוס מנות */}
      <section className="mb-6 md:mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">סטטוס מנות</h2>
        <Card>
          <CardContent className="p-6">
            {Object.keys(submissionStatusCounts).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(submissionStatusCounts).map(([status, count]) => (
                  <li key={status} className="flex justify-between items-center text-gray-700">
                    <span className="flex items-center">
                      {getStatusIcon(status)}
                      <span className="mr-2">{status}:</span>
                    </span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">אין כרגע הגשות במערכת.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* 3. הגלריה שלי */}
      <section className="mb-6 md:mb-8 flex-grow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-700">הגלריה שלי</h2>
        </div>

        {displayItems.length === 0 ? (
          <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg mb-2">הגלריה שלך ריקה כרגע.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayItems.map(item => (
              <Link to={`/customer/submissions/${item.id}`} key={item.id} className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden group">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 truncate" title={item.name}>{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.type}</p>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    {getStatusIcon(item.status)}
                    <span className="ml-1.5 capitalize">{item.status || 'לא ידוע'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    הועלה: {new Date(item.uploadedAt).toLocaleDateString('he-IL')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. חבילה נוכחית (בתחתית) - Restyled */}
      <section className="mt-auto pt-6 md:pt-8"> 
        <Card className="shadow-lg">
          <CardHeader className="pb-2"> {/* Adjusted padding */}
            <CardTitle className="text-2xl font-bold text-center text-gray-800">חבילה נוכחית</CardTitle> {/* Larger, bolder title */}
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-4 p-6">
            {/* Package Name - more prominent */}
            <p className="text-lg font-semibold text-gray-700">{clientPackage.packageName || "-"}</p>

            {/* Button - centered */}
            <Button asChild variant="outline" className="w-full max-w-xs h-11 text-base">
                <Link to="/customer/package-details">צפה בפרטי החבילה</Link>
            </Button>

            {/* Remaining/Total Dishes - clearer layout */}
            <div className="flex flex-col items-center pt-2">
              <p className="text-3xl font-bold text-primary">{clientPackage.remainingDishes ?? '0'}</p>
              <p className="text-sm text-gray-600">
                מנות נותרו מתוך {clientPackage.totalDishes ?? '0'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default CustomerHome; 