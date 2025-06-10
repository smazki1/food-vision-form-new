import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // PERFORMANCE FIX: Local state for immediate UI responsiveness
  const [localNotesContent, setLocalNotesContent] = useState('');
  const [localNextFollowUpDate, setLocalNextFollowUpDate] = useState('');
  const [localReminderDetails, setLocalReminderDetails] = useState('');

  const { clients } = useClients();
  const client = useMemo(() => clients.find(c => c.client_id === clientId), [clients, clientId]);
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

  // PERFORMANCE FIX: Initialize local state from server data
  useEffect(() => {
    if (robustNote && localNotesContent !== robustNote.content) {
      setLocalNotesContent(robustNote.content);
    }
  }, [robustNote?.content]);

  useEffect(() => {
    if (client) {
      if (localNextFollowUpDate !== (client.next_follow_up_date || '')) {
        setLocalNextFollowUpDate(client.next_follow_up_date || '');
      }
      if (localReminderDetails !== (client.reminder_details || '')) {
        setLocalReminderDetails(client.reminder_details || '');
      }
      
      loadLeadAndCommentsData();
    }
  }, [client?.client_id]); // Only depend on client ID changes

  const loadLeadAndCommentsData = useCallback(async () => {
    if (!client?.original_lead_id) return;
    
    try {
      setIsLoading(true);
      
      // Load lead data if this client was converted from a lead
      await loadLeadData(client.original_lead_id);

    } catch (error) {
      console.error('Error loading client activity data:', error);
      toast.error('שגיאה בטעינת נתוני הפעילות');
    } finally {
      setIsLoading(false);
    }
  }, [client?.original_lead_id]);

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

  // PERFORMANCE FIX: Optimized handlers with debouncing built-in
  const handleNotesChange = useCallback((newNotes: string) => {
    setLocalNotesContent(newNotes); // Immediate UI update
    updateRobustNotes(newNotes); // Background server update with debouncing
  }, [updateRobustNotes]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    // Immediate local state update
    if (fieldName === 'next_follow_up_date') {
      setLocalNextFollowUpDate(value);
    } else if (fieldName === 'reminder_details') {
      setLocalReminderDetails(value);
    }
  }, []);

  const handleFieldBlur = useCallback(async (fieldName: string, value: any) => {
    if (!client) return;
    
    // Skip if value hasn't changed from server state
    const serverValue = fieldName === 'next_follow_up_date' 
      ? client.next_follow_up_date 
      : client.reminder_details;
    
    if (serverValue === value) return;

    try {
      await clientUpdateMutation.mutateAsync({
        clientId,
        updates: { [fieldName]: value }
      });
    } catch (error) {
      console.error('Error updating field:', error);
      // Reset to server value on error
      if (fieldName === 'next_follow_up_date') {
        setLocalNextFollowUpDate(client.next_follow_up_date || '');
      } else if (fieldName === 'reminder_details') {
        setLocalReminderDetails(client.reminder_details || '');
      }
    }
  }, [client, clientId, clientUpdateMutation]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      await addRobustComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('[ClientActivityNotes] Comment addition error:', error);
    }
  }, [newComment, addRobustComment]);

  const handleForceRefresh = useCallback(async () => {
    console.log('[ClientActivityNotes] Force refreshing comments...');
    forceRefresh();
    toast.success('רענון תגובות הופעל');
  }, [forceRefresh]);

  const handleDebugComments = useCallback(async () => {
    console.log('[ClientActivityNotes] Running comment debug...');
    await debugClientComments(clientId);
    toast.success('בדיקת תגובות הושלמה - בדוק את הקונסול');
  }, [clientId]);

  const handleForceSync = useCallback(async () => {
    console.log('[ClientActivityNotes] Force syncing lead comments...');
    const success = await forceCommentSync(clientId);
    if (success) {
      forceRefresh();
      toast.success('סנכרון תגובות הושלם בהצלחה');
    } else {
      toast.error('שגיאה בסנכרון תגובות');
    }
  }, [clientId, forceRefresh]);

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
              {client?.original_lead_id && (
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
                  value={localNotesContent}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  className="mt-1"
                  placeholder="הערות כלליות על הלקוח, העדפות, הנחיות מיוחדות..."
                  rows={6}
                  disabled={isUpdatingNotes}
                />
                {isUpdatingNotes && (
                  <div className="text-xs text-gray-500 mt-1">שומר...</div>
                )}
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
                      {client?.original_lead_id && (
                        <p className="text-xs text-gray-400">
                          לקוח זה הומר מליד: {client.original_lead_id}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">תאריך מעקב הבא</Label>
              <Input
                type="date"
                value={localNextFollowUpDate}
                onChange={(e) => handleFieldChange('next_follow_up_date', e.target.value)}
                onBlur={(e) => handleFieldBlur('next_follow_up_date', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">פרטי תזכורת</Label>
              <Input
                value={localReminderDetails}
                onChange={(e) => handleFieldChange('reminder_details', e.target.value)}
                onBlur={(e) => handleFieldBlur('reminder_details', e.target.value)}
                placeholder="פרטי התזכורת למעקב"
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 