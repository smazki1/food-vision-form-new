import React from 'react';
import { useClientSubmissions } from '@/hooks/useClientSubmissions';
import { useClients } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerReviewPageTabProps {
  clientId: string;
}

const CustomerReviewPageTab: React.FC<CustomerReviewPageTabProps> = ({ clientId }) => {
  const { clients } = useClients();
  const client = clients.find(c => c.client_id === clientId);
  const { data: submissions, isLoading } = useClientSubmissions(clientId);

  const handleCopyLink = async () => {
    const reviewUrl = `${window.location.origin}/customer-review/${clientId}`;
    
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reviewUrl);
        toast.success('קישור הועתק ללוח');
        return;
      }
      
      // Fallback to legacy method
      const textArea = document.createElement('textarea');
      textArea.value = reviewUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success('קישור הועתק ללוח');
      } else {
        throw new Error('Copy command failed');
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      // Show the URL so user can copy manually
      toast.error(`לא ניתן להעתיק אוטומטית. קישור: ${reviewUrl}`);
    }
  };

  const handleOpenInNewTab = () => {
    const reviewUrl = `${window.location.origin}/customer-review/${clientId}`;
    window.open(reviewUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>טוען עמוד ביקורת ללקוח...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            עמוד ביקורת ללקוח
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={handleOpenInNewTab}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              פתח בחלון חדש
            </Button>
            <Button 
              variant="outline"
              onClick={handleCopyLink}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              העתק קישור ללקוח
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            כך נראה העמוד ללקוח עם כל ההגשות שלו
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תצוגה מקדימה</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold">גלריית {client?.restaurant_name || 'המסעדה'}</h1>
              <p className="text-muted-foreground">תוצאות הצילום המקצועי שלכם</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {submissions?.map((submission) => (
                <div key={submission.submission_id} className="bg-white rounded-lg border overflow-hidden">
                  {submission.main_processed_image_url ? (
                    <img 
                      src={submission.main_processed_image_url} 
                      alt={submission.item_name_at_submission}
                      className="w-full h-48 object-cover"
                    />
                  ) : submission.original_image_urls?.[0] ? (
                    <img 
                      src={submission.original_image_urls[0]} 
                      alt={submission.item_name_at_submission}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">אין תמונה</span>
                    </div>
                  )}
                  
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">
                      {submission.item_name_at_submission}
                    </h3>
                    <Badge variant="outline" className="mt-1 text-xs">
                      {submission.submission_status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submission.processed_image_urls?.length || 0} וריאציות
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {(!submissions || submissions.length === 0) && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">עדיין אין הגשות</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReviewPageTab; 