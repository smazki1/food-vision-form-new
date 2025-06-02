import React, { useState } from 'react';
import { useLeadSubmissions } from '@/hooks/useSubmissions';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';
import { SUBMISSION_STATUSES } from '@/types/submission';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  User
} from 'lucide-react';

interface SubmissionsSectionProps {
  leadId: string;
  viewMode?: 'compact' | 'expanded';
}

export const SubmissionsSection: React.FC<SubmissionsSectionProps> = ({
  leadId,
  viewMode = 'compact'
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const { data: submissions = [], isLoading, error } = useLeadSubmissions(leadId);

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedSubmissionId(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            הגשות מקושרות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            הגשות מקושרות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 text-sm">שגיאה בטעינת ההגשות</p>
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
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">אין הגשות מקושרות לליד זה</p>
            </div>
          ) : (
            <div className="space-y-3">
              {submissions.map((submission) => {
                const statusInfo = SUBMISSION_STATUSES[submission.submission_status as keyof typeof SUBMISSION_STATUSES];
                
                return (
                  <div
                    key={submission.submission_id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">
                          {submission.item_name_at_submission}
                        </h4>
                        <Badge className={`text-xs ${statusInfo.color}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSubmission(submission.submission_id)}
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        צפה
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{submission.item_type}</span>
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
                          {submission.processed_image_urls?.length || 0} תמונות מעובדות
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>
                          {submission.original_image_urls?.length || 0} תמונות מקור
                        </span>
                      </div>
                    </div>

                    {/* Quick LoRA info if available */}
                    {submission.lora_name && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">LoRA:</span> {submission.lora_name}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Viewer in Sheet */}
      <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <SheetContent 
          side="right" 
          className="w-[90vw] max-w-[1200px] sm:max-w-[1200px] p-0"
        >
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle>פרטי הגשה</SheetTitle>
            <SheetDescription>
              צפייה ועריכת פרטי ההגשה המקושרת
            </SheetDescription>
          </SheetHeader>
          
          {selectedSubmissionId && (
            <div className="h-[calc(100vh-120px)] overflow-y-auto">
              <SubmissionViewer
                submissionId={selectedSubmissionId}
                viewMode="admin"
                context="lead-panel"
                onClose={handleCloseViewer}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}; 