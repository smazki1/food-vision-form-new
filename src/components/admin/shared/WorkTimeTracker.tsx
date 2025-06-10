import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Play, Pause, Square, Clock, Edit3, Save, X, Timer, ChevronDown, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentUserRole } from '@/hooks/useCurrentUserRole';
import { cn } from '@/lib/utils';

interface WorkTimeSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  category?: string;
}

interface WorkActivity {
  id: string;
  time: string;
  category: string;
  description: string;
  duration: number;
}

interface WorkTimeTrackerProps {
  entityType: 'client' | 'lead';
  entityId: string;
  totalWorkTimeMinutes?: number;
}

const WORK_CATEGORIES = [
  { value: 'מכירה', label: 'מכירה' },
  { value: 'יצירה', label: 'יצירה' },
  { value: 'עריכה', label: 'עריכה' },
  { value: 'אפיון', label: 'אפיון' },
  { value: 'לוגיסטיקה', label: 'לוגיסטיקה' },
  { value: 'אחר', label: 'אחר' }
];

export const WorkTimeTracker: React.FC<WorkTimeTrackerProps> = ({
  entityType,
  entityId,
  totalWorkTimeMinutes = 0
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionTime, setCurrentSessionTime] = useState(0);
  const [editingTotal, setEditingTotal] = useState(false);
  const [editTotalValue, setEditTotalValue] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isStoppingTimer, setIsStoppingTimer] = useState(false);
  const [justStopped, setJustStopped] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isCompact, setIsCompact] = useState(true);
  const [preventRestart, setPreventRestart] = useState(false);
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const queryClient = useQueryClient();
  
  // Use the same auth hook as the rest of the app
  const { userId, isLoading: authLoading, status } = useCurrentUserRole();
  
  // Debug logging for auth state
  console.log('[WorkTimeTracker] Auth state:', { userId, authLoading, status, entityType, entityId });

  // Fetch active session and recent sessions
  const { data: sessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['work-time-sessions', entityType, entityId],
    queryFn: async () => {
      console.log('Fetching sessions for:', { entityType, entityId, userId });
      
      if (!userId) {
        console.log('No userId from auth hook, skipping sessions query');
        return [];
      }
      
      const { data, error } = await supabase
        .from('work_time_sessions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Sessions query result:', { data, error });
      if (error) {
        console.error('Sessions query error details:', error);
        throw error;
      }
      
      // Convert sessions to activities format
      const sessionActivities: WorkActivity[] = data
        .filter(session => !session.is_active && session.duration_minutes)
        .map(session => ({
          id: session.id,
          time: new Date(session.start_time).toLocaleTimeString('he-IL', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          category: session.notes?.split('|')[1] || 'אחר',
          description: session.notes?.split('|')[0] || session.notes || '',
          duration: session.duration_minutes || 0
        }));
      
      setActivities(sessionActivities);
      return data as WorkTimeSession[];
    },
    enabled: !!entityId && !!userId && status === 'ROLE_DETERMINED',
    retry: (failureCount, error: any) => {
      // Don't retry auth errors
      if (error?.code === 'PGRST301' || error?.message?.includes('JWT')) {
        console.log('Auth error in sessions query, not retrying:', error);
        return false;
      }
      return failureCount < 3;
    },
  });

  // Check for active session on mount - but respect preventRestart flag
  useEffect(() => {
    const activeSession = sessions.find(s => s.is_active);
    
    if (activeSession && !isRunning && !preventRestart && !isStoppingTimer && !justStopped) {
      console.log('Found active session in database, restarting timer:', activeSession.id);
      setIsRunning(true);
      setActiveSessionId(activeSession.id);
      startTimeRef.current = new Date(activeSession.start_time);
      const elapsedTime = Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000);
      setCurrentSessionTime(elapsedTime);
      setIsCompact(false); // Expand when timer is running
      
      // Restore category and notes from session
      if (activeSession.notes) {
        const [notes, category] = activeSession.notes.split('|');
        setSessionNotes(notes || '');
        setSelectedCategory(category || '');
      }
    }
  }, [sessions, isRunning, isStoppingTimer, justStopped, preventRestart]);

  // Clear justStopped flag after a delay
  useEffect(() => {
    if (justStopped) {
      const timeout = setTimeout(() => {
        console.log('Clearing justStopped flag');
        setJustStopped(false);
      }, 3000); // 3 second delay to prevent race conditions
      
      return () => clearTimeout(timeout);
    }
  }, [justStopped]);

  // Clear preventRestart flag after longer delay
  useEffect(() => {
    if (preventRestart) {
      const timeout = setTimeout(() => {
        setPreventRestart(false);
      }, 10000); // 10 seconds to ensure no restart
      
      return () => clearTimeout(timeout);
    }
  }, [preventRestart]);

  // Timer effect
  useEffect(() => {
    console.log('Timer effect triggered, isRunning:', isRunning);
    
    if (isRunning && !intervalRef.current) {
      console.log('Starting timer interval');
      intervalRef.current = setInterval(() => {
        setCurrentSessionTime(prev => {
          console.log('Timer tick, prev:', prev);
          return prev + 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      console.log('Stopping timer interval in useEffect');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        console.log('Cleanup: clearing timer interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ש ${mins}ד`;
    }
    return `${mins}ד`;
  };

  const formatCompactMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}`;
    }
    return `${mins}ד`;
  };

  const handleStart = async () => {
    try {
      console.log('Starting timer for:', { entityType, entityId, userId, authLoading });
      
      if (authLoading || status !== 'ROLE_DETERMINED') {
        toast.error('ממתין לאימות...');
        return;
      }
      
      if (!userId) {
        toast.error('אנא התחבר מחדש לחשבון');
        return;
      }

      if (!selectedCategory) {
        toast.error('אנא בחר קטגוריה');
        return;
      }

      const startTime = new Date();
      startTimeRef.current = startTime;
      setIsCompact(false); // Expand when starting
      setPreventRestart(false); // Allow normal operation
      
      // Combine notes and category for storage
      const combinedNotes = `${sessionNotes}|${selectedCategory}`;
      
      console.log('About to start session via edge function:', {
        action: 'start',
        entityType,
        entityId,
        notes: combinedNotes
      });
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/work-time-manager`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'start',
          entityType,
          entityId,
          notes: combinedNotes
        })
      });

      const data = await response.json();
      console.log('Start timer response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'שגיאה בהתחלת הטיימר');
      }

      setActiveSessionId(data.data?.id || 'temp-session');
      setIsRunning(true);
      setCurrentSessionTime(0);
      toast.success('הטיימר התחיל!');
      
      // Refresh sessions data
      refetchSessions();

    } catch (error: any) {
      console.error('Timer start error:', error);
      toast.error(error.message || 'שגיאה בהתחלת הטיימר');
    }
  };

  const handleStop = async () => {
    if (isStoppingTimer) {
      console.log('Already stopping timer, ignoring click');
      return;
    }

    try {
      setIsStoppingTimer(true);
      setJustStopped(true);
      setPreventRestart(true); // Prevent any restart attempts
      
      console.log('Stopping timer with active session ID:', activeSessionId);
      
      // Force clear the timer interval IMMEDIATELY
      if (intervalRef.current) {
        console.log('Force clearing timer interval before stop');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Update UI state immediately to prevent restart
      setIsRunning(false);

      const sessionId = activeSessionId || localStorage.getItem('activeWorkTimeSession');

      if (!sessionId) {
        // Try with entity-specific key
        const entitySessionId = localStorage.getItem('activeWorkTimeSession_' + entityType + '_' + entityId);
        
        if (!entitySessionId) {
          // Force stop the session in database by finding any active session
          const activeSession = sessions.find(s => s.is_active);
          if (activeSession) {
            await forceStopSession(activeSession.id);
          } else {
            toast.error('לא נמצאה סשן פעילה');
            return;
          }
        }
      }

      // Calculate duration based on the timer display
      const durationMinutes = Math.max(1, Math.round(currentSessionTime / 60));

      // Combine notes and category for storage
      const combinedNotes = `${sessionNotes}|${selectedCategory}`;

      try {
        const stopResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/work-time-manager`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'stop',
            sessionId: sessionId,
            durationMinutes: durationMinutes,
            notes: combinedNotes
          })
        });

        const stopData = await stopResponse.json();

        if (!stopResponse.ok || !stopData.success) {
          // If edge function fails, try direct database update
          await forceStopSession(sessionId);
        }
      } catch (edgeFunctionError) {
        console.error('Edge function failed, using direct database update:', edgeFunctionError);
        // Fallback to direct database update
        await forceStopSession(sessionId);
      }

      // Update local state immediately
      setActiveSessionId(null);
      setCurrentSessionTime(0);
      setSessionNotes('');
      setSelectedCategory('');
      setIsCompact(true); // Collapse when stopped
      
      localStorage.removeItem('activeWorkTimeSession');
      localStorage.removeItem('activeWorkTimeSession_' + entityType + '_' + entityId);
      
      toast.success(`הטיימר נעצר! נשמר ${durationMinutes} דקות`);
      
      // Refresh data
      await refetchSessions();
      await queryClient.invalidateQueries({ queryKey: ['client'] });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });

    } catch (error: any) {
      console.error('Timer stop error:', error);
      toast.error(error.message || 'שגיאה בעצירת הטיימר');
      
      // Reset state on error
      setIsRunning(false);
      setActiveSessionId(null);
      setCurrentSessionTime(0);
      setIsCompact(true);
    } finally {
      setIsStoppingTimer(false);
    }
  };

  // Direct database fallback for stopping sessions
  const forceStopSession = async (sessionId: string) => {
    const durationMinutes = Math.max(1, Math.round(currentSessionTime / 60));
    const combinedNotes = `${sessionNotes}|${selectedCategory}`;
    
    const { error: updateError } = await supabase
      .from('work_time_sessions')
      .update({
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        is_active: false,
        notes: combinedNotes
      })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    const tableName = entityType === 'client' ? 'clients' : 'leads';
    const idColumn = entityType === 'client' ? 'client_id' : 'lead_id';
    
    const { data: currentData } = await supabase
      .from(tableName)
      .select('total_work_time_minutes')
      .eq(idColumn, entityId)
      .single();

    const newTotal = (currentData?.total_work_time_minutes || 0) + durationMinutes;

    const { error: updateTotalError } = await supabase
      .from(tableName)
      .update({ total_work_time_minutes: newTotal })
      .eq(idColumn, entityId);

    if (updateTotalError) throw updateTotalError;
  };

  const handlePause = async () => {
    // Placeholder for pause functionality
    toast.info('פונקציית השהיה תמומש בקרוב');
  };

  const handleEditTotal = async () => {
    try {
      const newMinutes = parseInt(editTotalValue, 10);
      if (isNaN(newMinutes) || newMinutes < 0) {
        toast.error('אנא הזן מספר תקין של דקות');
        return;
      }

      const tableName = entityType === 'client' ? 'clients' : 'leads';
      const idColumn = entityType === 'client' ? 'client_id' : 'lead_id';

      const { error } = await supabase
        .from(tableName)
        .update({ total_work_time_minutes: newMinutes })
        .eq(idColumn, entityId);

      if (error) throw error;

      setEditingTotal(false);
      setEditTotalValue('');
      toast.success('זמן העבודה הכולל עודכן');
      
      await queryClient.invalidateQueries({ queryKey: ['client'] });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Error updating total work time:', error);
      toast.error('שגיאה בעדכון זמן העבודה');
    }
  };

  const startEdit = () => {
    setEditingTotal(true);
    setEditTotalValue(totalWorkTimeMinutes.toString());
  };

  const cancelEdit = () => {
    setEditingTotal(false);
    setEditTotalValue('');
  };

  // Delete activity function
  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from('work_time_sessions')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      // Remove from local activities state
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      
      toast.success('הפעילות נמחקה בהצלחה');
      
      // Refresh data to update totals
      await refetchSessions();
      await queryClient.invalidateQueries({ queryKey: ['client'] });
      await queryClient.invalidateQueries({ queryKey: ['leads'] });
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('שגיאה במחיקת הפעילות');
    }
  };

  // Calculate summary by category
  const getSummaryByCategory = () => {
    const summary: Record<string, number> = {};
    activities.forEach(activity => {
      summary[activity.category] = (summary[activity.category] || 0) + activity.duration;
    });
    return summary;
  };

  const categoryTotals = getSummaryByCategory();
  const totalMinutes = Object.values(categoryTotals).reduce((sum, minutes) => sum + minutes, 0);

  // Don't render anything until auth is loaded
  if (authLoading || status !== 'ROLE_DETERMINED') {
    return (
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200" dir="rtl">
        <div className="flex items-center gap-2 text-slate-600">
          <div className="w-3 h-3 bg-slate-300 rounded-full animate-pulse" />
          <span className="text-sm">טוען...</span>
        </div>
      </div>
    );
  }

  // Show auth error if no userId after loading
  if (status === 'ROLE_DETERMINED' && !userId) {
    return (
      <div className="bg-red-50 rounded-lg p-3 border border-red-200" dir="rtl">
        <div className="flex items-center gap-2 text-red-600">
          <Timer className="w-3 h-3" />
          <span className="text-sm">אנא התחבר לחשבון</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 transition-all duration-200" dir="rtl">
      {/* Header with timer and controls */}
      <div className="p-4 border-b border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 text-right">מעקב זמני עבודה</h3>
        
        {/* Timer Row */}
        <div className="flex items-center gap-4 mb-4">
          {/* Timer Display */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-mono font-bold text-slate-700">
              {formatTime(currentSessionTime)}
            </div>
            <Button
              onClick={isRunning ? handleStop : handleStart}
              disabled={isStoppingTimer || (!isRunning && !selectedCategory)}
              size="sm"
              className={cn(
                "h-8 px-3",
                isRunning 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-green-500 hover:bg-green-600 text-white"
              )}
            >
              {isStoppingTimer ? 'עוצר...' : isRunning ? 'עצור' : 'התחל'}
            </Button>
          </div>

          {/* Category Selection */}
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isRunning}>
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="בחר קטגוריה..." />
              </SelectTrigger>
              <SelectContent align="end">
                {WORK_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value} className="text-right">
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description Input */}
          <div className="flex-1">
            <Input
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="תיאור מה אני עושה..."
              className="text-right"
              disabled={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Activities Table */}
      {activities.length > 0 && (
        <div className="p-4 border-b border-slate-100">
          <h4 className="text-md font-medium text-slate-700 mb-3 text-right">פעילויות שנרשמו:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-right py-2 px-3 font-medium text-slate-600">זמן</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">תיאור</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">קטגוריה</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">משך</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-600">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice().reverse().map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 px-3 text-right text-slate-600">{activity.time}</td>
                    <td className="py-2 px-3 text-right">{activity.description || '-'}</td>
                    <td className="py-2 px-3 text-right">
                      <Badge variant="secondary" className="text-xs">{activity.category}</Badge>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-700">
                      {formatTime(activity.duration * 60)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteActivity(activity.id)}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            <span>מחק</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="p-4">
        <h4 className="text-md font-medium text-slate-700 mb-3 text-right">סיכום זמנים:</h4>
        
        {/* Category Totals */}
        {Object.keys(categoryTotals).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {Object.entries(categoryTotals).map(([category, minutes]) => (
              <div key={category} className="bg-slate-50 rounded-md p-3 text-right">
                <div className="text-sm font-medium text-slate-600">{category}</div>
                <div className="text-lg font-bold text-slate-800">{formatTime(minutes * 60)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Total Time Section */}
        <div className="bg-blue-50 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="text-right">
              <span className="text-sm font-medium text-slate-700">סה״כ זמן כולל:</span>
              {!editingTotal && (
                <Button
                  onClick={startEdit}
                  variant="ghost"
                  size="sm"
                  className="mr-2 h-5 w-5 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {editingTotal ? (
              <div className="flex items-center gap-2">
                <Button onClick={cancelEdit} size="sm" variant="ghost" className="h-7 px-2">
                  <X className="h-3 w-3" />
                </Button>
                <Button onClick={handleEditTotal} size="sm" className="h-7 px-2">
                  <Save className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  value={editTotalValue}
                  onChange={(e) => setEditTotalValue(e.target.value)}
                  placeholder="דקות"
                  className="h-7 text-sm w-20 text-right"
                  min="0"
                />
              </div>
            ) : (
              <div className="text-xl font-bold text-blue-600">
                {formatTime(totalWorkTimeMinutes * 60)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 