import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Submission } from '@/api/submissionApi';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Eye, 
  Download, 
  Filter, 
  Search, 
  Grid3X3, 
  List, 
  Calendar,
  FileImage,
  FileText,
  Palette,
  CheckSquare,
  MoreHorizontal,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type ViewMode = 'cards' | 'table' | 'compact';
type SortField = 'uploaded_at' | 'item_name_at_submission' | 'submission_status';
type SortDirection = 'asc' | 'desc';

interface FilterState {
  status: string;
  itemType: string;
  dateRange: string;
  hasProcessedImages: string;
  hasBrandingMaterials: string;
  hasReferenceExamples: string;
}

const SubmissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('uploaded_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    itemType: 'all',
    dateRange: 'all',
    hasProcessedImages: 'all',
    hasBrandingMaterials: 'all',
    hasReferenceExamples: 'all'
  });

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
            created_lead_id,
            description,
            restaurant_name,
            contact_name,
            email,
            phone
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
            submission_contact_name: submission.contact_name || '',
            submission_contact_email: submission.email || '',
            submission_contact_phone: submission.phone || '',
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

  // Enhanced filtering and sorting logic
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = submissions.filter(submission => {
      // Text search
      const searchMatch = submission.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.item_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (submission.restaurant_name && submission.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!searchMatch) return false;

      // Status filter
      if (filters.status !== 'all' && submission.submission_status !== filters.status) return false;

      // Item type filter
      if (filters.itemType !== 'all' && submission.item_type !== filters.itemType) return false;

      // Date range filter
      if (filters.dateRange !== 'all') {
        const uploadDate = new Date(submission.uploaded_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'today':
            if (daysDiff > 0) return false;
            break;
          case 'week':
            if (daysDiff > 7) return false;
            break;
          case 'month':
            if (daysDiff > 30) return false;
            break;
        }
      }

      // Processed images filter
      if (filters.hasProcessedImages === 'yes' && (!submission.processed_image_urls || submission.processed_image_urls.length === 0)) return false;
      if (filters.hasProcessedImages === 'no' && submission.processed_image_urls && submission.processed_image_urls.length > 0) return false;

      // Branding materials filter
      if (filters.hasBrandingMaterials === 'yes' && (!submission.branding_material_urls || submission.branding_material_urls.length === 0)) return false;
      if (filters.hasBrandingMaterials === 'no' && submission.branding_material_urls && submission.branding_material_urls.length > 0) return false;

      // Reference examples filter
      if (filters.hasReferenceExamples === 'yes' && (!submission.reference_example_urls || submission.reference_example_urls.length === 0)) return false;
      if (filters.hasReferenceExamples === 'no' && submission.reference_example_urls && submission.reference_example_urls.length > 0) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'uploaded_at':
          aValue = new Date(a.uploaded_at).getTime();
          bValue = new Date(b.uploaded_at).getTime();
          break;
        case 'item_name_at_submission':
          aValue = a.item_name_at_submission.toLowerCase();
          bValue = b.item_name_at_submission.toLowerCase();
          break;
        case 'submission_status':
          aValue = a.submission_status;
          bValue = b.submission_status;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [submissions, searchTerm, filters, sortField, sortDirection]);

  // Get unique values for filter dropdowns
  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.submission_status)));
  }, [submissions]);

  const uniqueItemTypes = useMemo(() => {
    return Array.from(new Set(submissions.map(s => s.item_type)));
  }, [submissions]);

  // Selection handlers
  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSubmissions);
    if (checked) {
      newSelected.add(submissionId);
    } else {
      newSelected.delete(submissionId);
    }
    setSelectedSubmissions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(new Set(filteredAndSortedSubmissions.map(s => s.submission_id)));
    } else {
      setSelectedSubmissions(new Set());
    }
  };

  // Bulk operations
  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedSubmissions.size === 0) {
      toast.error('לא נבחרו הגשות');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_submissions')
        .update({ submission_status: newStatus })
        .in('submission_id', Array.from(selectedSubmissions));

      if (error) throw error;

      toast.success(`עודכנו ${selectedSubmissions.size} הגשות לסטטוס: ${newStatus}`);
      setSelectedSubmissions(new Set());
      // Refetch data
      window.location.reload();
    } catch (error) {
      console.error('Error updating submissions:', error);
      toast.error('שגיאה בעדכון ההגשות');
    }
  };

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

  const getFileTypeIcon = (type: 'original' | 'processed' | 'branding' | 'reference') => {
    switch (type) {
      case 'original': return <FileImage className="h-4 w-4" />;
      case 'processed': return <FileImage className="h-4 w-4 text-green-600" />;
      case 'branding': return <Palette className="h-4 w-4 text-purple-600" />;
      case 'reference': return <FileText className="h-4 w-4 text-blue-600" />;
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
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">ניהול הגשות</h1>
          <p className="text-gray-600 mt-1">
            סה"כ {submissions.length} הגשות • מוצג {filteredAndSortedSubmissions.length} הגשות
            {selectedSubmissions.size > 0 && (
              <span className="text-blue-600"> • נבחרו {selectedSubmissions.size}</span>
            )}
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'compact' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('compact')}
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters and Search Section */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="חיפוש לפי שם פריט, סוג או מסעדה..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            פילטרים
          </Button>

          {/* Sort */}
          <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
            const [field, direction] = value.split('-') as [SortField, SortDirection];
            setSortField(field);
            setSortDirection(direction);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="מיון" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uploaded_at-desc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  תאריך העלאה (חדש לישן)
                </div>
              </SelectItem>
              <SelectItem value="uploaded_at-asc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  תאריך העלאה (ישן לחדש)
                </div>
              </SelectItem>
              <SelectItem value="item_name_at_submission-asc">שם פריט (א-ת)</SelectItem>
              <SelectItem value="item_name_at_submission-desc">שם פריט (ת-א)</SelectItem>
              <SelectItem value="submission_status-asc">סטטוס</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">סטטוס</label>
                <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסטטוסים</SelectItem>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">סוג פריט</label>
                <Select value={filters.itemType} onValueChange={(value) => setFilters({...filters, itemType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל הסוגים</SelectItem>
                    {uniqueItemTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">טווח זמן</label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התקופות</SelectItem>
                    <SelectItem value="today">היום</SelectItem>
                    <SelectItem value="week">השבוע האחרון</SelectItem>
                    <SelectItem value="month">החודש האחרון</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">תמונות מעובדות</label>
                <Select value={filters.hasProcessedImages} onValueChange={(value) => setFilters({...filters, hasProcessedImages: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכול</SelectItem>
                    <SelectItem value="yes">עם תמונות מעובדות</SelectItem>
                    <SelectItem value="no">ללא תמונות מעובדות</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">קבצי מיתוג</label>
                <Select value={filters.hasBrandingMaterials} onValueChange={(value) => setFilters({...filters, hasBrandingMaterials: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכול</SelectItem>
                    <SelectItem value="yes">עם קבצי מיתוג</SelectItem>
                    <SelectItem value="no">ללא קבצי מיתוג</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">דוגמאות</label>
                <Select value={filters.hasReferenceExamples} onValueChange={(value) => setFilters({...filters, hasReferenceExamples: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">הכול</SelectItem>
                    <SelectItem value="yes">עם דוגמאות</SelectItem>
                    <SelectItem value="no">ללא דוגמאות</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedSubmissions.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">נבחרו {selectedSubmissions.size} הגשות</span>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    עדכון סטטוס
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>בחר סטטוס חדש</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uniqueStatuses.map(status => (
                    <DropdownMenuItem key={status} onClick={() => handleBulkStatusUpdate(status)}>
                      <Badge className={getStatusColor(status)} variant="secondary">
                        {status}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={() => setSelectedSubmissions(new Set())}>
                בטל בחירה
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {filteredAndSortedSubmissions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600">לא נמצאו הגשות התואמות לקריטריונים</p>
          {submissions.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">בדוק את הלוגים בקונסול לפרטים נוספים</p>
          )}
        </div>
      ) : (
        <>
          {/* Cards View */}
          {viewMode === 'cards' && (
            <div className="grid gap-4">
              {filteredAndSortedSubmissions.map((submission) => (
                <Card key={submission.submission_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedSubmissions.has(submission.submission_id)}
                          onCheckedChange={(checked) => handleSelectSubmission(submission.submission_id, checked as boolean)}
                        />
                        <div>
                          <CardTitle className="text-lg">{submission.item_name_at_submission}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{submission.item_type}</Badge>
                            {submission.restaurant_name && (
                              <span className="text-sm text-gray-600">• {submission.restaurant_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(submission.submission_status)}>
                        {submission.submission_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                                         {/* Thumbnail and file info section */}
                     <div className="flex gap-4 mb-4">
                       {/* Thumbnail preview */}
                       <div className="flex-shrink-0">
                         {submission.original_image_urls && submission.original_image_urls.length > 0 ? (
                           <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                             <img 
                               src={submission.original_image_urls[0]} 
                               alt={`תצוגה מקדימה - ${submission.item_name_at_submission}`}
                               className="w-full h-full object-cover"
                             />
                           </div>
                         ) : (
                           <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                             <FileImage className="h-8 w-8 text-gray-400" />
                           </div>
                         )}
                       </div>
                       
                       {/* File counts grid */}
                       <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                         <div className="flex items-center gap-2">
                           {getFileTypeIcon('original')}
                           <span className="text-sm">תמונות: {submission.original_image_urls?.length || 0}</span>
                         </div>
                         {submission.processed_image_urls && submission.processed_image_urls.length > 0 && (
                           <div className="flex items-center gap-2">
                             {getFileTypeIcon('processed')}
                             <span className="text-sm">מעובדות: {submission.processed_image_urls.length}</span>
                           </div>
                         )}
                         {submission.branding_material_urls && submission.branding_material_urls.length > 0 && (
                           <div className="flex items-center gap-2">
                             {getFileTypeIcon('branding')}
                             <span className="text-sm">מיתוג: {submission.branding_material_urls.length}</span>
                           </div>
                         )}
                         {submission.reference_example_urls && submission.reference_example_urls.length > 0 && (
                           <div className="flex items-center gap-2">
                             {getFileTypeIcon('reference')}
                             <span className="text-sm">דוגמאות: {submission.reference_example_urls.length}</span>
                           </div>
                         )}
                       </div>
                     </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        <p>הועלה: {new Date(submission.uploaded_at).toLocaleDateString('he-IL', {
                          day: '2-digit',
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        {submission.processed_at && (
                          <p>עובד: {new Date(submission.processed_at).toLocaleDateString('he-IL')}</p>
                        )}
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

          {/* Table View */}
          {viewMode === 'table' && (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b bg-gray-50">
                      <tr>
                        <th className="p-4 text-right">
                                                     <Checkbox
                             checked={selectedSubmissions.size === filteredAndSortedSubmissions.length && filteredAndSortedSubmissions.length > 0}
                             onCheckedChange={handleSelectAll}
                           />
                        </th>
                        <th className="p-4 text-right font-medium">פריט</th>
                        <th className="p-4 text-right font-medium">סוג</th>
                        <th className="p-4 text-right font-medium">סטטוס</th>
                        <th className="p-4 text-right font-medium">קבצים</th>
                        <th className="p-4 text-right font-medium">תאריך העלאה</th>
                        <th className="p-4 text-right font-medium">פעולות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedSubmissions.map((submission) => (
                        <tr key={submission.submission_id} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <Checkbox
                              checked={selectedSubmissions.has(submission.submission_id)}
                              onCheckedChange={(checked) => handleSelectSubmission(submission.submission_id, checked as boolean)}
                            />
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{submission.item_name_at_submission}</div>
                              {submission.restaurant_name && (
                                <div className="text-sm text-gray-600">{submission.restaurant_name}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{submission.item_type}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={getStatusColor(submission.submission_status)}>
                              {submission.submission_status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {submission.original_image_urls?.length || 0} תמונות
                              </span>
                              {submission.branding_material_urls && submission.branding_material_urls.length > 0 && (
                                <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                                  {submission.branding_material_urls.length} מיתוג
                                </span>
                              )}
                              {submission.reference_example_urls && submission.reference_example_urls.length > 0 && (
                                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                                  {submission.reference_example_urls.length} דוגמאות
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                          </td>
                          <td className="p-4">
                            <Button size="sm" onClick={() => handleViewSubmission(submission.submission_id)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compact View */}
          {viewMode === 'compact' && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {filteredAndSortedSubmissions.map((submission) => (
                    <div key={submission.submission_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedSubmissions.has(submission.submission_id)}
                          onCheckedChange={(checked) => handleSelectSubmission(submission.submission_id, checked as boolean)}
                        />
                        <div>
                          <span className="font-medium">{submission.item_name_at_submission}</span>
                          <span className="text-sm text-gray-600 mx-2">•</span>
                          <span className="text-sm text-gray-600">{submission.item_type}</span>
                          {submission.restaurant_name && (
                            <>
                              <span className="text-sm text-gray-600 mx-2">•</span>
                              <span className="text-sm text-gray-600">{submission.restaurant_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(submission.submission_status)} variant="secondary">
                          {submission.submission_status}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => handleViewSubmission(submission.submission_id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Submission Viewer Sheet */}
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
