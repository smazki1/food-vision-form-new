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
  Clock,
  RefreshCw,
  Bug
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useClients } from '@/hooks/useClients';
import { useClientUpdate } from '@/hooks/useClientUpdate';
import { useRobustClientComments, useRobustNotes } from '@/hooks/useRobustComments';
import { debugClientComments, forceCommentSync } from '@/utils/testLeadCommentTransfer';

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
  const [leadActivities, setLeadActivities] = useState<LeadActivity[]>([]);
  const [leadComments, setLeadComments] = useState<LeadComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Local editing state for input fields
  const [editingNextFollowUpDate, setEditingNextFollowUpDate] = useState('');
  const [editingReminderDetails, setEditingReminderDetails] = useState('');

  const { clients } = useClients();
  const client = clients.find(c => c.client_id === clientId);
  const clientUpdateMutation = useClientUpdate();

  // Use robust comments and notes system
  const { 
    comments: robustComments, 
    isLoading: robustCommentsLoading, 
    addComment: addRobustComment, 
    isAddingComment,
    forceRefresh 
  } = useRobustClientComments(clientId);
  
  const { 
    note: robustNote, 
    isLoading: robustNoteLoading, 
    updateNotes: updateRobustNotes, 
    isUpdating: isUpdatingNotes 
  } = useRobustNotes(clientId, 'client');

  // Use client data directly from useClients instead of separate queries
  const nextFollowUpDate = client?.next_follow_up_date || '';
  const reminderDetails = client?.reminder_details || '';
  const linkedLeadId = client?.original_lead_id || null;

  useEffect(() => {
    if (client) {
      // Initialize editing state with current values (notes now handled by robust system)
      setEditingNextFollowUpDate(client.next_follow_up_date || '');
      setEditingReminderDetails(client.reminder_details || '');
      
      loadLeadAndCommentsData();
    }
  }, [clientId, client]);

  const loadLeadAndCommentsData = async () => {
    try {
      setIsLoading(true);
      
      // Comments now handled by robust system - no need to parse internal_notes
      console.log('[ClientActivityNotes] Using robust comments system, no manual parsing needed');

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
      console.log('[ClientActivityNotes] Using robust notes system for update');
      await updateRobustNotes(newNotes);
      // Success/error messages handled by robust system
    } catch (error) {
      console.error('[ClientActivityNotes] Notes update error:', error);
      // Error handling done by robust system
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
      console.log('[ClientActivityNotes] Using robust comment system for adding comment');
      await addRobustComment(newComment.trim());
      setNewComment('');
      // Success/error messages handled by robust system
    } catch (error) {
      console.error('[ClientActivityNotes] Comment addition error:', error);
      // Error handling done by robust system
    }
  };

  const handleForceRefresh = async () => {
    console.log('[ClientActivityNotes] Force refreshing comments...');
    forceRefresh();
    toast.success('רענון תגובות הופעל');
  };

  const handleDebugComments = async () => {
    console.log('[ClientActivityNotes] Running comment debug...');
    await debugClientComments(clientId);
    toast.success('בדיקת תגובות הושלמה - בדוק את הקונסול');
  };

  const handleForceSync = async () => {
    console.log('[ClientActivityNotes] Force syncing lead comments...');
    const success = await forceCommentSync(clientId);
    if (success) {
      forceRefresh(); // Refresh UI after sync
      toast.success('סנכרון תגובות הושלם בהצלחה');
    } else {
      toast.error('שגיאה בסנכרון תגובות');
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
      {/* Main Notes and Comments Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              הערות ותגובות
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceRefresh}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                רענן
              </Button>
              {linkedLeadId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceSync}
                  className="flex items-center gap-1"
                >
                  <ArrowRight className="h-4 w-4" />
                  סנכרן מליד
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugComments}
                className="flex items-center gap-1"
              >
                <Bug className="h-4 w-4" />
                בדיקה
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column: Notes */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">הערות כלליות</Label>
                <Textarea
                  value={robustNote?.content || ''}
                  onChange={(e) => handleNotesUpdate(e.target.value)}
                  onBlur={(e) => handleNotesUpdate(e.target.value)}
                  className="mt-1"
                  placeholder="הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות..."
                  rows={6}
                  disabled={isUpdatingNotes}
                />
              </div>
            </div>

            {/* Right Column: Comments */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">תגובות</Label>
                
                {/* Add Comment */}
                <div className="flex gap-2 mb-4">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="הוסף תגובה חדשה..."
                    className="flex-1"
                    rows={2}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={isAddingComment || !newComment.trim()}
                    className="self-end"
                  >
                    {isAddingComment ? 'מוסיף...' : 'הוסף'}
                  </Button>
                </div>

                {/* Comments List */}
                <div className="max-h-48 overflow-y-auto">
                  {robustCommentsLoading ? (
                    <p className="text-sm text-gray-500">טוען תגובות...</p>
                  ) : robustComments && robustComments.length > 0 ? (
                    <div className="space-y-2">
                      {robustComments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between mb-1">
                            <Badge variant="outline">
                              {comment.source === 'lead' ? 'מליד' : 'לקוח'}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {comment.id}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(comment.timestamp).toLocaleString('he-IL')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500 mb-2">אין תגובות עדיין</p>
                      {linkedLeadId && (
                        <p className="text-xs text-gray-400">
                          לקוח זה הומר מליד: {linkedLeadId}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Follow-up Details */}
          <Separator className="my-6" />
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium">תאריך מעקב הבא</Label>
              <Input
                type="date"
                value={editingNextFollowUpDate}
                onChange={(e) => setEditingNextFollowUpDate(e.target.value)}
                onBlur={(e) => handleFieldBlur('next_follow_up_date', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">פרטי תזכורת</Label>
              <Textarea
                value={editingReminderDetails}
                onChange={(e) => setEditingReminderDetails(e.target.value)}
                onBlur={(e) => handleFieldBlur('reminder_details', e.target.value)}
                placeholder="פרטי התזכורת למעקב..."
                className="mt-1"
                rows={3}
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
              <Badge variant="secondary" className="mr-2">
                {linkedLeadId}
              </Badge>
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
                <Label className="text-sm font-medium mb-2 block">פעילויות מהליד</Label>
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
                    <p className="text-sm text-gray-500 text-center py-4">אין פעילויות מהליד</p>
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