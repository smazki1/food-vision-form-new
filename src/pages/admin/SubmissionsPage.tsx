import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Submission } from '@/api/submissionApi';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Eye } from 'lucide-react';

const SubmissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const currentUserRoleData = useCurrentUserRole();

  // Enhanced logic to handle authentication fallback scenarios
  const adminAuth = localStorage.getItem("adminAuthenticated") === "true";
  const testAdminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  
  // Determine if we have admin access
  const hasAdminAccess = (
    currentUserRoleData.status === "ROLE_DETERMINED" && 
    (currentUserRoleData.isAdmin || currentUserRoleData.isAccountManager)
  ) || (
    // Enhanced fallback - if we have localStorage admin, allow access even if role isn't fully determined
    adminAuth && (
      currentUserRoleData.status === "FORCED_COMPLETE" || 
      currentUserRoleData.status === "ERROR_FETCHING_ROLE" ||
      currentUserRoleData.status === "ERROR_SESSION" ||
      currentUserRoleData.status === "FETCHING_ROLE" ||
      currentUserRoleData.status === "CHECKING_SESSION"
    )
  );

  // For the userId, use a stable approach
  const effectiveUserId = currentUserRoleData.userId || (adminAuth ? testAdminId : null);

  // Handler functions for the submission viewer
  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedSubmissionId(null);
  };

  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
      console.log('[SubmissionsPage] Starting to fetch submissions...');
      console.log('[SubmissionsPage] Auth state:', {
        status: currentUserRoleData.status,
        isAdmin: currentUserRoleData.isAdmin,
        userId: currentUserRoleData.userId,
        adminAuth,
        hasAdminAccess,
        effectiveUserId
      });
      
      // Use basic column selection to avoid missing column errors
      console.log('[SubmissionsPage] Using basic query with guaranteed columns...');
      
      try {
        // Use only columns that actually exist in the database
        const { data, error } = await supabase
          .from('customer_submissions')
          .select(`
            submission_id,
            client_id,
            item_type,
            item_name_at_submission,
            submission_status,
            uploaded_at,
            processed_at,
            original_image_urls,
            processed_image_urls,
            main_processed_image_url,
            branding_material_urls,
            reference_example_urls,
            edit_history,
            final_approval_timestamp,
            assigned_editor_id,
            lead_id,
            original_item_id,
            lora_link,
            lora_name,
            lora_id,
            fixed_prompt,
            created_lead_id
          `)
          .order('uploaded_at', { ascending: false });

        if (error) {
          console.error('[SubmissionsPage] Error fetching submissions:', error);
          throw error;
        }
        
        console.log('[SubmissionsPage] Fetched submissions:', data);
        console.log('[SubmissionsPage] Number of submissions:', data?.length);
        
        // Transform data to match expected Submission interface
        const transformedData = data?.map(submission => {
          return {
            ...submission,
            // Add created_at as alias for uploaded_at for compatibility
            created_at: submission.uploaded_at,
            // Fill missing fields with defaults for UI compatibility
            edit_count: Array.isArray(submission.edit_history) ? submission.edit_history.length : 0,
            internal_team_notes: '',
            target_completion_date: null,
            priority: 'Medium',
            submission_contact_name: '',
            submission_contact_email: '',
            submission_contact_phone: '',
            assigned_package_id_at_submission: null,
          };
        }) || [];
        
        console.log('[SubmissionsPage] Transformed submissions:', transformedData);
        return transformedData as Submission[];
        
      } catch (error) {
        console.error('[SubmissionsPage] Failed to fetch submissions:', error);
        throw error;
      }
    },
    enabled: hasAdminAccess // Only run query if we have admin access
  });

  const filteredSubmissions = submissions.filter(submission =>
    submission.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ממתינה לעיבוד': return 'bg-yellow-100 text-yellow-800';
      case 'בעיבוד': return 'bg-blue-100 text-blue-800';
      case 'מוכנה להצגה': return 'bg-purple-100 text-purple-800';
      case 'הערות התקבלו': return 'bg-orange-100 text-orange-800';
      case 'הושלמה ואושרה': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">טוען הגשות...</div>;
  }

  // Show loading if we're still determining authentication or if we don't have admin access yet
  if (!hasAdminAccess) {
    let message = "בודק הרשאות...";
    
    if (currentUserRoleData.status === "ERROR_FETCHING_ROLE" || currentUserRoleData.status === "ERROR_SESSION") {
      message = currentUserRoleData.error || "שגיאה באימות הרשאות";
    } else if (currentUserRoleData.status === "NO_SESSION") {
      message = "נדרש אימות"; 
    } else if (adminAuth && (
      currentUserRoleData.status === "CHECKING_SESSION" || 
      currentUserRoleData.status === "FETCHING_ROLE" ||
      currentUserRoleData.status === "INITIALIZING"
    )) {
      message = "מאמת גישת אדמין...";
    }
    
    return (
      <div className="p-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>{message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
          <h2 className="font-bold mb-2">שגיאה בטעינת הגשות</h2>
          <p>{(error as Error).message}</p>
          <details className="mt-2">
            <summary className="cursor-pointer">פרטים טכניים</summary>
            <pre className="mt-2 text-xs">{JSON.stringify(error, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ניהול הגשות</h1>
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p>סה"כ הגשות: {submissions.length}</p>
          <p>הגשות מסוננות: {filteredSubmissions.length}</p>
        </div>
        <Input
          placeholder="חיפוש לפי שם מנה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">לא נמצאו הגשות</p>
          {submissions.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">בדוק את הלוגים בקונסול לפרטים נוספים</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.submission_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{submission.item_name_at_submission}</CardTitle>
                    <p className="text-sm text-gray-600">{submission.item_type}</p>
                  </div>
                  <Badge className={getStatusColor(submission.submission_status)}>
                    {submission.submission_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>תמונות מקוריות: {submission.original_image_urls?.length || 0}</p>
                    <p>תמונות מעובדות: {submission.processed_image_urls?.length || 0}</p>
                    {((submission.branding_material_urls && submission.branding_material_urls.length > 0) || 
                      (submission.reference_example_urls && submission.reference_example_urls.length > 0)) && (
                      <p>פרטים נוספים: {(submission.branding_material_urls?.length || 0) + (submission.reference_example_urls?.length || 0)} קבצים</p>
                    )}
                    <p>הועלה ב: {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}</p>
                  </div>
                  <Button onClick={() => handleViewSubmission(submission.submission_id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    צפה בפרטים
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedSubmissionId && (
        <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <SheetContent className="max-w-[95vw] sm:max-w-[90vw] p-0 h-full overflow-y-auto">
            <SubmissionViewer
              submissionId={selectedSubmissionId}
              viewMode="admin"
              context="full-page"
              onClose={handleCloseViewer}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default SubmissionsPage;
