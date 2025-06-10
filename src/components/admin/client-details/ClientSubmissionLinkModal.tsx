import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Link, Search, FileText, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/client';
interface SubmissionForLinking {
  submission_id: string;
  client_id: string;
  item_type: string;
  item_name_at_submission: string;
  submission_status: string;
  uploaded_at: string;
  original_image_urls: string[] | null;
  clients?: {
    restaurant_name: string;
    contact_name: string;
  };
}

interface ClientSubmissionLinkModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClientSubmissionLinkModal: React.FC<ClientSubmissionLinkModalProps> = ({
  client,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionForLinking[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<SubmissionForLinking[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Fetch unlinked submissions or submissions from other clients
  useEffect(() => {
    if (isOpen) {
      fetchAvailableSubmissions();
    }
  }, [isOpen]);

  // Filter submissions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubmissions(submissions);
    } else {
      const filtered = submissions.filter(submission => 
        submission.item_name_at_submission?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.item_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        submission.submission_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredSubmissions(filtered);
    }
  }, [searchQuery, submissions]);

  const fetchAvailableSubmissions = async () => {
    setIsLoading(true);
    try {
      // Get submissions that are not linked to this client
      // Start with a simple query first  
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          client_id,
          lead_id,
          item_type,
          item_name_at_submission,
          submission_status,
          uploaded_at,
          original_image_urls
        `)
        .order('uploaded_at', { ascending: false })
        .limit(50);

       if (error) {
         console.error('Error fetching submissions:', error);
         toast.error('שגיאה בטעינת הגשות');
         return;
       }

       // Filter out submissions that belong to the current client
       const filteredData = (data || []).filter(submission => 
         submission.client_id !== client.client_id
       );

       // Get client and lead information separately for each submission
       const submissionsWithInfo = await Promise.all(
         filteredData.map(async (submission) => {
           let clientInfo = null;
           
           if (submission.client_id) {
             const { data: clientData } = await supabase
               .from('clients')
               .select('restaurant_name, contact_name')
               .eq('client_id', submission.client_id)
               .single();
             clientInfo = clientData;
           } else if (submission.lead_id) {
             const { data: leadData } = await supabase
               .from('leads')
               .select('restaurant_name, contact_name')
               .eq('lead_id', submission.lead_id)
               .single();
             clientInfo = leadData ? {
               restaurant_name: leadData.restaurant_name || 'ליד',
               contact_name: leadData.contact_name || 'לא ידוע'
             } : null;
           }
           
           return {
             ...submission,
             clients: clientInfo
           };
         })
       );

       setSubmissions(submissionsWithInfo);
    } catch (error) {
      console.error('Error:', error);
      toast.error('אירעה שגיאה בטעינת הגשות');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkSubmission = async () => {
    if (!selectedSubmissionId) {
      toast.error('יש לבחור הגשה לקישור');
      return;
    }

    setIsLinking(true);
    try {
      // Update the submission to link it to the current client
      const { error } = await supabase
        .from('customer_submissions')
        .update({ 
          client_id: client.client_id,
          // Add a note that this was manually linked
          description: `הגשה נקשרה ידנית ללקוח ${client.restaurant_name} על ידי מנהל המערכת`
        })
        .eq('submission_id', selectedSubmissionId);

      if (error) {
        console.error('Error linking submission:', error);
        throw new Error(`שגיאה בקישור ההגשה: ${error.message}`);
      }

      toast.success('ההגשה נקשרה בהצלחה ללקוח!');
      onSuccess?.();
      onClose();
      
    } catch (error: any) {
      console.error('Link error:', error);
      toast.error(error.message || 'אירעה שגיאה בקישור ההגשה');
    } finally {
      setIsLinking(false);
    }
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

  const selectedSubmission = submissions.find(s => s.submission_id === selectedSubmissionId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            קשר הגשה קיימת ללקוח {client.restaurant_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">חיפוש הגשות</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חפש לפי שם פריט, סוג או מזהה הגשה..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Submissions List */}
          <div className="flex-1 min-h-0">
            <div className="h-[400px] overflow-y-auto space-y-2 pr-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">לא נמצאו הגשות זמינות לקישור</p>
                  <p className="text-sm mt-2">נסה לחפש במונחים אחרים או בדוק שיש הגשות במערכת</p>
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <Card 
                    key={submission.submission_id}
                    className={`cursor-pointer transition-colors ${
                      selectedSubmissionId === submission.submission_id 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedSubmissionId(submission.submission_id)}
                  >
                    <CardContent className="p-4">
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
                          
                          <div className="text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>הועלה: {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>לקוח נוכחי: {(submission as any).clients?.restaurant_name || 'לא ידוע'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-500">
                            מזהה הגשה: {submission.submission_id}
                          </div>

                          {/* Image preview */}
                          {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                            <div className="mt-2">
                              <div className="flex gap-1">
                                {submission.original_image_urls.slice(0, 3).map((url: string, index: number) => (
                                  <img
                                    key={index}
                                    src={url}
                                    alt={`תמונה ${index + 1}`}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                ))}
                                {submission.original_image_urls.length > 3 && (
                                  <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                                    +{submission.original_image_urls.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Selected Submission Info */}
          {selectedSubmission && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 text-blue-900">הגשה נבחרה לקישור:</h4>
                <div className="text-sm text-blue-800">
                  <p><strong>שם פריט:</strong> {selectedSubmission.item_name_at_submission}</p>
                  <p><strong>סוג:</strong> {selectedSubmission.item_type}</p>
                  <p><strong>סטטוס:</strong> {selectedSubmission.submission_status}</p>
                  <p><strong>לקוח נוכחי:</strong> {(selectedSubmission as any).clients?.restaurant_name || 'לא ידוע'}</p>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  <strong>שים לב:</strong> קישור ההגשה יעביר אותה מהלקוח הנוכחי ללקוח {client.restaurant_name}.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLinking}>
              ביטול
            </Button>
            <Button 
              onClick={handleLinkSubmission} 
              disabled={isLinking || !selectedSubmissionId}
            >
              {isLinking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  מקשר הגשה...
                </>
              ) : (
                'קשר הגשה ללקוח'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 