import React, { useState } from 'react';
import { 
  useLeadSubmissions, 
  useLinkSubmissionToLead, 
  useActivateFreeSamplePackage,
  useSearchSubmissionById,
  useUnlinkedSubmissions
} from '@/hooks/useSubmissions';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';
import { SUBMISSION_STATUSES } from '@/types/submission';
import { LeadSubmissionModal } from './LeadSubmissionModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  FileText, 
  Eye, 
  Camera, 
  Calendar,
  User,
  Plus,
  Link,
  Package,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Lead } from '@/types/lead';

interface SubmissionsSectionProps {
  leadId: string;
  lead?: Lead;
  viewMode?: 'compact' | 'detailed';
}

export const SubmissionsSection: React.FC<SubmissionsSectionProps> = ({
  leadId,
  lead,
  viewMode = 'compact'
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [submissionIdToLink, setSubmissionIdToLink] = useState('');

  const { data: submissions = [], isLoading, error } = useLeadSubmissions(leadId);
  const { data: unlinkedSubmissions = [] } = useUnlinkedSubmissions();
  const { data: searchedSubmission } = useSearchSubmissionById(submissionIdToLink);
  const linkSubmissionMutation = useLinkSubmissionToLead();
  const activatePackageMutation = useActivateFreeSamplePackage();

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedSubmissionId(null);
  };

  const handleUploadSubmission = () => {
    setIsUploadModalOpen(true);
  };

  const handleLinkExistingSubmission = async () => {
    if (!submissionIdToLink) {
      toast.error('יש להזין מזהה הגשה');
      return;
    }

    if (!searchedSubmission) {
      toast.error('הגשה לא נמצאה');
      return;
    }

    if (searchedSubmission.lead_id || searchedSubmission.client_id) {
      toast.error('ההגשה כבר מקושרת לליד או לקוח אחר');
      return;
    }

    try {
      await linkSubmissionMutation.mutateAsync({
        submissionId: submissionIdToLink,
        leadId
      });
      
      // Automatically activate free sample package if not already active
      await activatePackageMutation.mutateAsync(leadId);
      
      setIsLinkModalOpen(false);
      setSubmissionIdToLink('');
    } catch (error) {
      console.error('Error linking submission:', error);
    }
  };

  const handleLinkUnlinkedSubmission = async (submissionId: string) => {
    try {
      await linkSubmissionMutation.mutateAsync({
        submissionId,
        leadId
      });
      
      await activatePackageMutation.mutateAsync(leadId);
      toast.success('הגשה קושרה בהצלחה');
    } catch (error) {
      console.error('Error linking submission:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="mr-2">טוען הגשות...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            שגיאה בטעינת ההגשות: {(error as Error).message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              הגשות מקושרות
              <Badge variant="outline" className="text-xs">
                {submissions.length}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLinkModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Link className="h-4 w-4" />
                קשר הגשה
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadSubmission}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                העלה הגשה
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>אין הגשות מקושרות לליד זה</p>
              <p className="text-sm">השתמש בכפתורים למעלה כדי להוסיף הגשה</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.submission_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{submission.item_name_at_submission}</h4>
                        <Badge variant="secondary">
                          {SUBMISSION_STATUSES[submission.submission_status]?.label || submission.submission_status}
                        </Badge>
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          מקושר
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>סוג: {submission.item_type}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          <span>
                            {submission.original_image_urls?.length || 0} תמונות מקוריות
                          </span>
                        </div>
                        {((submission.branding_material_urls && submission.branding_material_urls.length > 0) || 
                          (submission.reference_example_urls && submission.reference_example_urls.length > 0)) ? (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>פרטים נוספים: {(submission.branding_material_urls?.length || 0) + (submission.reference_example_urls?.length || 0)} קבצים</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            <span>מזהה: {submission.submission_id.slice(-8)}</span>
                          </div>
                        )}
                      </div>

                      {/* Contact Information if available */}
                      {(submission.contact_name || submission.email || submission.phone) && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium text-gray-700 mb-1">פרטי יצירת קשר:</div>
                          {submission.contact_name && (
                            <div>שם: {submission.contact_name}</div>
                          )}
                          {submission.email && (
                            <div>אימייל: {submission.email}</div>
                          )}
                          {submission.phone && (
                            <div>טלפון: {submission.phone}</div>
                          )}
                        </div>
                      )}

                      {/* Original Images Preview Grid */}
                      {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-2">תמונות מקוריות:</div>
                          <div className="grid grid-cols-4 gap-2 max-w-sm">
                            {submission.original_image_urls.slice(0, 4).map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`תמונה מקורית ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => handleViewSubmission(submission.submission_id)}
                              />
                            ))}
                            {submission.original_image_urls.length > 4 && (
                              <div 
                                className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={() => handleViewSubmission(submission.submission_id)}
                              >
                                <span className="text-xs text-gray-600">
                                  +{submission.original_image_urls.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Processed Images Preview Grid (if any) */}
                      {submission.processed_image_urls && submission.processed_image_urls.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-2">תמונות מעובדות:</div>
                          <div className="grid grid-cols-4 gap-2 max-w-sm">
                            {submission.processed_image_urls.slice(0, 4).map((url, index) => (
                              <img
                                key={index}
                                src={url}
                                alt={`תמונה מעובדת ${index + 1}`}
                                className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-green-200"
                                onClick={() => handleViewSubmission(submission.submission_id)}
                              />
                            ))}
                            {submission.processed_image_urls.length > 4 && (
                              <div 
                                className="w-full aspect-square bg-green-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-100 transition-colors border-2 border-green-200"
                                onClick={() => handleViewSubmission(submission.submission_id)}
                              >
                                <span className="text-xs text-green-600">
                                  +{submission.processed_image_urls.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmission(submission.submission_id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      הצג
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Viewer Modal */}
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

      {/* Link Existing Submission Modal */}
      <Sheet open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <SheetContent className="w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle>קישור הגשה קיימת</SheetTitle>
            <SheetDescription>
              חפש וקשר הגשה קיימת לליד זה
            </SheetDescription>
          </SheetHeader>
          
          <Tabs defaultValue="search" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">חיפוש לפי מזהה</TabsTrigger>
              <TabsTrigger value="browse">עיון בהגשות לא מקושרות</TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="submission-id">מזהה הגשה</Label>
                <Input
                  id="submission-id"
                  placeholder="מזהה הגשה (UUID)"
                  value={submissionIdToLink}
                  onChange={(e) => setSubmissionIdToLink(e.target.value)}
                />
              </div>
              
              {searchedSubmission && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{searchedSubmission.item_name_at_submission}</h4>
                    <Badge variant="secondary">{searchedSubmission.item_type}</Badge>
                    {searchedSubmission.lead_id || searchedSubmission.client_id ? (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        כבר מקושר
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        זמין לקישור
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    תאריך הגשה: {new Date(searchedSubmission.uploaded_at).toLocaleDateString('he-IL')}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  onClick={handleLinkExistingSubmission}
                  disabled={!submissionIdToLink || linkSubmissionMutation.isPending || !searchedSubmission || !!searchedSubmission.lead_id || !!searchedSubmission.client_id}
                  className="flex-1"
                >
                  {linkSubmissionMutation.isPending ? 'מקשר...' : 'קשר הגשה'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsLinkModalOpen(false)}
                >
                  ביטול
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="browse" className="space-y-4">
              <div className="space-y-2">
                <Label>הגשות זמינות לקישור</Label>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {unlinkedSubmissions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      אין הגשות זמינות לקישור
                    </p>
                  ) : (
                    unlinkedSubmissions.map((submission) => (
                      <div key={submission.submission_id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-sm">{submission.item_name_at_submission}</h5>
                            <p className="text-xs text-gray-600">
                              {submission.item_type} • {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                            </p>
                            <p className="text-xs text-gray-500">
                              מזהה: {submission.submission_id.slice(-8)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleLinkUnlinkedSubmission(submission.submission_id)}
                            disabled={linkSubmissionMutation.isPending}
                          >
                            קשר
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Lead Submission Upload Modal */}
      {lead && (
        <LeadSubmissionModal
          lead={lead}
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}
    </>
  );
}; 