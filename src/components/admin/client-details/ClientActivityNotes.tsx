import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  MessageCircle, 
  FileText, 
  Link as LinkIcon,
  Calendar,
  User,
  ArrowRight,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useClientUpdate } from '@/hooks/useClientUpdate';

interface ClientComment {
  id: string;
  text: string;
  timestamp: string;
  source?: 'client' | 'lead';
}

interface LeadActivity {
  activity_id: string;
  activity_description: string;
  activity_timestamp: string;
}

interface LeadComment {
  comment_id: string;
  comment_text: string;
  comment_timestamp: string;
}

interface ClientActivityNotesProps {
  clientId: string;
}

export const ClientActivityNotes: React.FC<ClientActivityNotesProps> = ({
  clientId
}) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [leadComments, setLeadComments] = useState<LeadComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local editing state for input fields
  const [editingNotes, setEditingNotes] = useState('');
  const [editingNextFollowUpDate, setEditingNextFollowUpDate] = useState('');
  const [editingReminderDetails, setEditingReminderDetails] = useState('');

  const { clients } = useClients();
  const client = clients.find(c => c.client_id === clientId);
  const clientUpdateMutation = useClientUpdate();

  // Use client data directly from useClients instead of separate queries
  const notes = client?.notes || '';
  const nextFollowUpDate = client?.next_follow_up_date || '';
  const reminderDetails = client?.reminder_details || '';
  const linkedLeadId = client?.original_lead_id || null;

  useEffect(() => {
    if (client) {
      // Initialize editing state with current values
      setEditingNotes(client.notes || '');
      setEditingNextFollowUpDate(client.next_follow_up_date || '');
      setEditingReminderDetails(client.reminder_details || '');
      
      loadLeadAndCommentsData();
    }
  }, [clientId, client]);

  const loadLeadAndCommentsData = async () => {
    try {
      setIsLoading(true);
      
      // Parse client comments from internal_notes (using existing client data)
      let storedComments: ClientComment[] = [];
      if (client?.internal_notes) {
        try {
          const parsed = JSON.parse(client.internal_notes);
          if (parsed.clientComments && Array.isArray(parsed.clientComments)) {
            storedComments = parsed.clientComments;
          }
        } catch (e) {
          // Not JSON or no comments
        }
      }
      setComments(storedComments);

      // Load lead data if this client was converted from a lead
      if (linkedLeadId) {
        await loadLeadData(linkedLeadId);
      }

    } catch (error) {
      console.error('Error loading client activity data:', error);
      toast.error('שגיאה בטעינת נתוני הפעילות');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLeadData = async (leadId: string) => {
    try {
      // Load lead activities
      const { data: activities, error: activitiesError } = await supabase
        .from('lead_activity_log')
        .select('*')
        .eq('lead_id', leadId)
        .order('activity_timestamp', { ascending: false });

      if (!activitiesError && activities) {
        setLeadActivities(activities);
      }

      // Load lead comments (from activities that start with "תגובה:")
      const leadCommentsFromActivities = activities?.filter(activity => 
        activity.activity_description.startsWith('תגובה:')
      ).map(activity => ({
        comment_id: activity.activity_id,
        comment_text: activity.activity_description.replace('תגובה: ', ''),
        comment_timestamp: activity.activity_timestamp
      })) || [];

      setLeadComments(leadCommentsFromActivities);
    } catch (error) {
      console.error('Error loading lead data:', error);
    }
  };

  const handleNotesUpdate = async (newNotes: string) => {
    try {
      await clientUpdateMutation.mutateAsync({
        clientId,
        updates: { notes: newNotes }
      });
      
      // Update local state on success
      setEditingNotes(newNotes);
    } catch (error) {
      console.error('Error updating notes:', error);
      // Reset to original value on error
      setEditingNotes(notes);
    }
  };

  const handleFieldBlur = async (fieldName: string, value: any) => {
    try {
      console.log(`Updating client field ${fieldName}:`, value);
      
      await clientUpdateMutation.mutateAsync({
        clientId,
        updates: { [fieldName]: value }
      });
      
      // Update local state on success
      if (fieldName === 'next_follow_up_date') {
        setEditingNextFollowUpDate(value);
      } else if (fieldName === 'reminder_details') {
        setEditingReminderDetails(value);
      }
    } catch (error) {
      console.error('Error updating field:', error);
      
      // Reset to original value on error
      if (fieldName === 'next_follow_up_date') {
        setEditingNextFollowUpDate(nextFollowUpDate);
      } else if (fieldName === 'reminder_details') {
        setEditingReminderDetails(reminderDetails);
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const newCommentObj: ClientComment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        timestamp: new Date().toISOString(),
        source: 'client'
      };

      const updatedComments = [newCommentObj, ...comments];
      
      // Save to internal_notes using the hook
      const existingNotes = client?.internal_notes || '';
      let notesData: any = {};
      
      try {
        notesData = JSON.parse(existingNotes);
      } catch (e) {
        notesData = { originalNotes: existingNotes };
      }
      
      notesData.clientComments = updatedComments;
      
      await clientUpdateMutation.mutateAsync({
        clientId,
        updates: { internal_notes: JSON.stringify(notesData) }
      });
      
      setComments(updatedComments);
      setNewComment('');
      toast.success('התגובה נוספה בהצלחה');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('שגיאה בהוספת התגובה');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            פעילות והערות
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

  return (
    <div className="space-y-6">
      {/* Notes and Comments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            מעקב והערות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 2-Column Layout: Notes and Comments */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Notes */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">הערות כלליות</Label>
                <Textarea
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  onBlur={(e) => handleNotesUpdate(e.target.value)}
                  className="mt-1"
                  placeholder="הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות..."
                  rows={6}
                />
              </div>
            </div>

            {/* Right Column: Comments */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  תגובות והערות
                </Label>
                
                {/* Add Comment */}
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="הוסף תגובה או הערה חדשה..."
                      rows={3}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      שלח
                    </Button>
                  </div>
                </div>

                <Separator className="my-3" />

                {/* Comments Display */}
                <div className="max-h-48 overflow-y-auto">
                  {comments.length > 0 ? (
                    <div className="space-y-2">
                      {comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                                                     <div className="flex items-center justify-between mb-1">
                             <Badge variant="outline">
                               {comment.source === 'lead' ? 'מליד' : 'לקוח'}
                             </Badge>
                           </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">אין תגובות עדיין</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                תאריך תזכורת הבאה
              </Label>
              <Input
                type="date"
                value={editingNextFollowUpDate ? editingNextFollowUpDate.split('T')[0] : ''}
                onChange={(e) => setEditingNextFollowUpDate(e.target.value)}
                onBlur={(e) => handleFieldBlur('next_follow_up_date', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                פרטי תזכורת
              </Label>
              <Input
                value={editingReminderDetails}
                onChange={(e) => setEditingReminderDetails(e.target.value)}
                onBlur={(e) => handleFieldBlur('reminder_details', e.target.value)}
                className="mt-1"
                placeholder="פרטי תזכורת או הנחיות מיוחדות"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead History Section */}
      {linkedLeadId && (leadActivities.length > 0 || leadComments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              היסטוריה מהליד המקורי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Lead Comments */}
              <div>
                <Label className="text-sm font-medium mb-2 block">תגובות מהליד</Label>
                <ScrollArea className="h-48">
                  {leadComments.length > 0 ? (
                    <div className="space-y-2">
                      {leadComments.map((comment) => (
                        <div key={comment.comment_id} className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
                          <p className="text-sm text-gray-700">{comment.comment_text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.comment_timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">אין תגובות מהליד</p>
                  )}
                </ScrollArea>
              </div>

              {/* Lead Activities */}
              <div>
                <Label className="text-sm font-medium mb-2 block">פעילות מהליד</Label>
                <ScrollArea className="h-48">
                  {leadActivities.length > 0 ? (
                    <div className="space-y-2">
                      {leadActivities.filter(activity => !activity.activity_description.startsWith('תגובה:')).map((activity) => (
                        <div key={activity.activity_id} className="p-3 bg-green-50 rounded-md border-l-4 border-green-200">
                          <p className="text-sm text-gray-700">{activity.activity_description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.activity_timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">אין פעילות מהליד</p>
                  )}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 