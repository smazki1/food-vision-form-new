import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { FileText, Eye, Download, ExternalLink, TrendingUp, Activity, Upload, Plus, Link } from 'lucide-react';
import { SubmissionViewer } from '@/components/admin/submissions/SubmissionViewer';
import { useClientSubmissions, useClientSubmissionStats } from '@/hooks/useClientSubmissions';
import { Client } from '@/types/client';
import { ClientSubmissionUploadModal } from './ClientSubmissionUploadModal';
import { ClientSubmissionLinkModal } from './ClientSubmissionLinkModal';
import { useQueryClient } from '@tanstack/react-query';
import LightboxDialog from '@/components/editor/submission/LightboxDialog';

interface ClientSubmissionsSectionProps {
  clientId: string;
  client: Client;
}

export const ClientSubmissionsSection: React.FC<ClientSubmissionsSectionProps> = ({
  clientId,
  client
}) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = React.useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = React.useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const queryClient = useQueryClient();
  
  // Use the real hooks
  const { data: submissions, isLoading, error, refetch } = useClientSubmissions(clientId);
  const { data: stats } = useClientSubmissionStats(clientId);

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedSubmissionId(null);
  };

  const handleImageClick = (imageUrl: string, images: string[]) => {
    setLightboxImages(images);
    setLightboxImage(imageUrl);
    setCurrentImageIndex(images.indexOf(imageUrl));
  };

  const navigateToIndex = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < lightboxImages.length) {
      setCurrentImageIndex(newIndex);
      setLightboxImage(lightboxImages[newIndex]);
    }
  };

  const handleDownloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUploadSubmission = () => {
    setIsUploadModalOpen(true);
  };

  const handleLinkSubmission = () => {
    setIsLinkModalOpen(true);
  };

  const handleUploadSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['client-submissions', clientId] });
    queryClient.invalidateQueries({ queryKey: ['client-submission-stats', clientId] });
    refetch();
  };

  const handleLinkSuccess = () => {
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['client-submissions', clientId] });
    queryClient.invalidateQueries({ queryKey: ['client-submission-stats', clientId] });
    refetch();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'מאושר':
      case 'הושלם':
      case 'הושלמה ואושרה':
        return 'bg-green-100 text-green-800';
      case 'בעיבוד':
      case 'ממתין לעיבוד':
      case 'ממתינה לעיבוד':
        return 'bg-yellow-100 text-yellow-800';
      case 'נדחה':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            הגשות הלקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            הגשות הלקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-center py-4">
            שגיאה בטעינת ההגשות: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סה"כ הגשות</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">הגשות מעובדות</p>
                  <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">בעיבוד</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Activity className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              הגשות הלקוח ({submissions?.length || 0})
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUploadSubmission}
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                העלה הגשה
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLinkSubmission}
                className="flex items-center gap-1"
              >
                <Link className="h-4 w-4" />
                קשר הגשה קיימת
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(!submissions || submissions.length === 0) ? (
            <div className="text-center text-gray-500 py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">לא נמצאו הגשות עבור לקוח זה</p>
              <p className="text-sm mt-2 mb-4">הגשות חדשות יופיעו כאן לאחר שהלקוח יעלה תמונות</p>
              
              {/* Action buttons in empty state */}
              <div className="flex justify-center gap-3 mt-6">
                <Button 
                  variant="default" 
                  onClick={handleUploadSubmission}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  העלה הגשה חדשה
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLinkSubmission}
                  className="flex items-center gap-2"
                >
                  <Link className="h-4 w-4" />
                  קשר הגשה קיימת
                </Button>
              </div>
              
              <p className="text-xs mt-4 text-gray-400">
                ניתן להעלות הגשה חדשה או לקשר הגשה קיימת מהמערכת
              </p>
            </div>
          ) : (
            <div className="h-[600px] overflow-y-auto pr-2">
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.submission_id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{submission.item_name_at_submission}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {submission.item_type}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(submission.submission_status)}`}>
                            {submission.submission_status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          <p>הועלה ב: {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}</p>
                          {submission.processed_at && (
                            <p>עובד ב: {new Date(submission.processed_at).toLocaleDateString('he-IL')}</p>
                          )}
                        </div>

                        {/* Image previews */}
                        {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-2">תמונות מקוריות:</p>
                            <div className="flex gap-2 flex-wrap">
                              {submission.original_image_urls.slice(0, 4).map((url: string, index: number) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`תמונה מקורית ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80"
                                    onClick={() => handleDownloadImage(url, `original-${index + 1}.jpg`)}
                                  />
                                </div>
                              ))}
                              {submission.original_image_urls.length > 4 && (
                                <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                                  +{submission.original_image_urls.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Processed images */}
                        {submission.processed_image_urls && submission.processed_image_urls.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium mb-2 text-green-700">תמונות מעובדות:</p>
                            <div className="flex gap-2 flex-wrap">
                              {submission.processed_image_urls.slice(0, 4).map((url: string, index: number) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`תמונה מעובדת ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded cursor-pointer hover:opacity-80 border-2 border-green-200"
                                    onClick={() => handleImageClick(url, submission.processed_image_urls)}
                                  />
                                </div>
                              ))}
                              {submission.processed_image_urls.length > 4 && (
                                <div className="w-16 h-16 bg-green-200 rounded flex items-center justify-center text-xs text-green-600">
                                  +{submission.processed_image_urls.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSubmission(submission.submission_id)}
                          className="text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          הצג
                        </Button>
                        
                        {submission.processed_image_urls && submission.processed_image_urls.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              submission.processed_image_urls?.forEach((url: string, index: number) => {
                                handleDownloadImage(url, `${submission.item_name_at_submission}-processed-${index + 1}.jpg`);
                              });
                            }}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            הורד
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Upload Submission Modal */}
      <ClientSubmissionUploadModal
        client={client}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Link Submission Modal */}
      <ClientSubmissionLinkModal
        client={client}
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onSuccess={handleLinkSuccess}
      />

      {/* Image Lightbox */}
      <LightboxDialog
        imageUrl={lightboxImage}
        images={lightboxImages}
        currentIndex={currentImageIndex}
        onNavigate={navigateToIndex}
        onClose={() => setLightboxImage(null)}
        open={!!lightboxImage}
      />
    </>
  );
}; 