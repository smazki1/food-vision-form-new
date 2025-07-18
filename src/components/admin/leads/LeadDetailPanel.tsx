import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useUpdateLeadWithConversion as useUpdateLead, 
  useAddLeadComment, 
  useLeadActivities,
  useLeadComments,
  useLeadById,
  LEAD_QUERY_KEY 
} from '@/hooks/useEnhancedLeads';
import { useRobustLeadComments, useRobustNotes } from '@/hooks/useRobustComments';
import { 
  Lead, 
  LeadStatusEnum, 
  LEAD_STATUS_DISPLAY,
  calculateTotalAICosts,
  convertUSDToILS,
  mapLeadStatusToHebrew,
  mapHebrewToLeadStatusEnum
} from '@/types/lead';
import { SubmissionsSection } from './SubmissionsSection';
import { LeadSubmissions2 } from './LeadSubmissions2';
import { SmartBusinessTypeSelect } from './SmartBusinessTypeSelect';
import { SmartLeadSourceSelect } from './SmartLeadSourceSelect';
import { SmartLeadStatusSelect } from './SmartLeadStatusSelect';
import { LeadSubmissionModal } from './LeadSubmissionModal';
import { 
  X, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Calendar,
  MessageCircle,
  Activity,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  Building,
  Upload,
  Clock
} from 'lucide-react';
import { WorkTimeTracker } from '@/components/admin/shared/WorkTimeTracker';

interface LeadDetailPanelProps {
  leadId: string;
  onClose: () => void;
  isArchiveView?: boolean;
}

interface ActivityLog {
  activity_id: string;
  lead_id: string;
  activity_timestamp: string;
  activity_description: string;
}

interface LeadComment {
  comment_id: string;
  lead_id: string;
  comment_text: string;
  created_at: string;
}

// Add extended status options including the new one
const EXTENDED_STATUS_OPTIONS = [
  'ליד חדש',
  'פנייה ראשונית בוצעה', 
  'בטיפול',
  'מעוניין',
  'לא מעוניין',
  'הפך ללקוח',
  'ארכיון',
  'להתעדכן'
];

// Business type options
const BUSINESS_TYPE_OPTIONS = [
  'מסעדה',
  'בית קפה',
  'מאפייה',
  'קייטרינג',
  'פיצרייה',
  'בר',
  'מזון רחוב',
  'בית חולים',
  'בית ספר',
  'משרד',
  'מלון',
  'אירועים',
  'אחר'
];

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  leadId,
  onClose,
  isArchiveView = false
}) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const queryClient = useQueryClient();
  
  const updateLeadMutation = useUpdateLead();
  const addCommentMutation = useAddLeadComment();
  const { data: activities, isLoading: activitiesLoading } = useLeadActivities(leadId);
  const { data: comments, isLoading: commentsLoading } = useLeadComments(leadId);
  
  // Use robust comments and notes system
  const { 
    comments: robustComments, 
    isLoading: robustCommentsLoading, 
    addComment: addRobustComment, 
    isAddingComment 
  } = useRobustLeadComments(leadId);
  
  const { 
    note: robustNote, 
    isLoading: robustNoteLoading, 
    updateNotes: updateRobustNotes, 
    isUpdating: isUpdatingNotes 
  } = useRobustNotes(leadId, 'lead');

  const { data: leadData, isLoading: leadLoading, error: leadError } = useLeadById(leadId);

  useEffect(() => {
    if (leadData) {
      setLead(leadData);
    }
  }, [leadData]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !lead) return;

    try {
      console.log('[LeadDetailPanel] Using robust comment system for adding comment');
      await addRobustComment(newComment);
      setNewComment('');
      // Success message handled by the robust system
    } catch (error) {
      console.error('[LeadDetailPanel] Comment submission error:', error);
      // Error message handled by the robust system
    }
  };

  // Always-editable field blur handler - handles both inline and select fields
  const handleFieldBlur = async (fieldName: string, value: any) => {
    if (!lead) return;

    console.log(`handleFieldBlur called for ${fieldName}:`, value);

    try {
      const updates = { [fieldName]: value };
      
      // When updating prompts count, also ensure the cost per unit is set to 0.162
      if (fieldName === 'ai_prompts_count') {
        updates.ai_prompt_cost_per_unit = 0.162;
      }

      // If lead status is being changed to "לא מעוניין" (not interested), automatically archive it
      if (fieldName === 'lead_status' && value === 'לא מעוניין') {
        updates.lead_status = 'ארכיון';
        
        await updateLeadMutation.mutateAsync({
          leadId: lead.lead_id,
          updates
        });
        
        console.log('Lead automatically archived after being marked as not interested');
        toast.success('הליד סומן כ"לא מעוניין" והועבר לארכיון אוטומטית');
        
        // Update local state to archived status
        setLead(prev => prev ? { ...prev, lead_status: 'ארכיון' } : null);
        
        return;
      }

      // If lead status is being changed to "הפך ללקוח" (converted to client), trigger conversion
      if (fieldName === 'lead_status' && value === 'הפך ללקוח') {
        console.log('Lead conversion to client initiated');
        
        // The mutation will handle the conversion automatically through useUpdateLeadWithConversion
        await updateLeadMutation.mutateAsync({
          leadId: lead.lead_id,
          updates
        });
        
        console.log('Lead successfully converted to client');
        toast.success('הליד הומר ללקוח בהצלחה והמערכת עודכנה!');
        
        // Update local state to converted status
        setLead(prev => prev ? { ...prev, lead_status: 'הפך ללקוח' } : null);
        
        // Close the panel after successful conversion as the lead is now a client
        setTimeout(() => {
          onClose();
        }, 1500);
        
        return;
      }

      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates
      });
      
      console.log(`Successfully updated ${fieldName}`);
      toast.success(`השדה ${fieldName === 'lead_status' ? 'סטטוס' : 
        fieldName === 'ai_prompts_count' ? 'פרומפטים' :
        fieldName === 'ai_training_25_count' ? 'אימונים $2.5' :
        fieldName === 'ai_training_15_count' ? 'אימונים $1.5' :
        fieldName === 'ai_training_5_count' ? 'אימונים $5' :
        'נתונים'} עודכן בהצלחה`);
      
      // Update local state
      setLead(prev => prev ? { ...prev, ...updates } : null);
      
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      toast.error(`שגיאה בעדכון השדה ${fieldName === 'lead_status' ? 'סטטוס' : 
        fieldName === 'ai_prompts_count' ? 'פרומפטים' : 
        fieldName === 'lead_status' && value === 'הפך ללקוח' ? 'בהמרה ללקוח' : ''}: ${error instanceof Error ? error.message : 'שגיאה לא צפויה'}`);
    }
  };

  if (leadLoading) {
    return (
      <Sheet open={!!leadId} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-[90vw] max-w-[1000px] sm:max-w-[1000px] p-6"
        >
          <SheetHeader>
            <SheetTitle>פרטי ליד</SheetTitle>
            <SheetDescription>טוען פרטי ליד...</SheetDescription>
          </SheetHeader>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (leadError || !lead) {
    return (
      <Sheet open={!!leadId} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-[90vw] max-w-[1000px] sm:max-w-[1000px] p-6"
        >
          <SheetHeader>
            <SheetTitle>פרטי ליד</SheetTitle>
            <SheetDescription>שגיאה בטעינת פרטי ליד</SheetDescription>
          </SheetHeader>
          <p className="text-red-600">
            {leadError ? 'שגיאה בטעינת פרטי הליד' : 'ליד לא נמצא'}
          </p>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!leadId} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-[90vw] max-w-[1000px] sm:max-w-[1000px] p-0 overflow-hidden"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            פרטי ליד - {lead.restaurant_name}
            {isArchiveView && (
              <Badge variant="destructive" className="ml-2">
                ארכיון
              </Badge>
            )}
          </SheetTitle>
          <SheetDescription>
            צפייה ועריכת פרטי הליד
          </SheetDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="px-6 py-2 border-b">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">פרטים</TabsTrigger>
              <TabsTrigger value="costs">עלויות</TabsTrigger>
              <TabsTrigger value="activity">פעילות</TabsTrigger>
              <TabsTrigger value="submissions">הגשות</TabsTrigger>
              <TabsTrigger value="submissions2">הגשות 2</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <TabsContent value="details" className="p-6 space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    פרטי הליד
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">שם מסעדה</Label>
                      <Input
                        value={lead.restaurant_name || ''}
                        onBlur={(e) => handleFieldBlur('restaurant_name', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, restaurant_name: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן שם מסעדה"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">איש קשר</Label>
                      <Input
                        value={lead.contact_name || ''}
                        onBlur={(e) => handleFieldBlur('contact_name', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, contact_name: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן שם איש קשר"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">טלפון</Label>
                      <Input
                        value={lead.phone || ''}
                        onBlur={(e) => handleFieldBlur('phone', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, phone: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן מספר טלפון"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">אימייל</Label>
                      <Input
                        value={lead.email || ''}
                        onBlur={(e) => handleFieldBlur('email', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, email: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן כתובת אימייל"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label className="text-sm font-medium">אתר</Label>
                      <Input
                        value={lead.website_url || ''}
                        onBlur={(e) => handleFieldBlur('website_url', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, website_url: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן כתובת אתר"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">כתובת</Label>
                      <Input
                        value={lead.address || ''}
                        onBlur={(e) => handleFieldBlur('address', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, address: e.target.value} : null)}
                        className="mt-1"
                        placeholder="הזן כתובת"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">סוג עסק</Label>
                      <Select
                        value={lead.business_type || ''}
                        onValueChange={(value) => handleFieldBlur('business_type', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="בחר סוג עסק" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">מקור ליד</Label>
                      <SmartLeadSourceSelect
                        value={lead.lead_source || ''}
                        onValueChange={(value) => handleFieldBlur('lead_source', value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">סטטוס</Label>
                      <Select
                        value={lead.lead_status}
                        onValueChange={(value) => {
                          console.log('Status selector - new value:', value);
                          handleFieldBlur('lead_status', value);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="בחר סטטוס" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXTENDED_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">תאריך יצירה</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4 inline-block mr-1" />
                        {new Date(lead.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  </div>

                  {/* Free Sample Package Toggle Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        חבילת טעימות
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">חבילת טעימות פעילה</h4>
                          <p className="text-sm text-gray-600">
                            {lead.free_sample_package_active 
                              ? 'הליד מקושר לחבילת טעימות פעילה'
                              : 'הליד לא מקושר לחבילת טעימות'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">
                            {lead.free_sample_package_active ? 'פעיל' : 'כבוי'}
                          </span>
                          <button
                            onClick={() => handleFieldBlur('free_sample_package_active', !lead.free_sample_package_active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              lead.free_sample_package_active ? 'bg-blue-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                lead.free_sample_package_active ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Follow-up and Notes Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
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
                          value={lead.notes || ''}
                          onBlur={(e) => handleFieldBlur('notes', e.target.value)}
                          onChange={(e) => setLead(prev => prev ? {...prev, notes: e.target.value} : null)}
                          className="mt-1"
                          placeholder="הערות כלליות על הליד, העדפות, הנחיות מיוחדות..."
                          rows={6}
                        />
                      </div>
                    </div>

                    {/* Right Column: Comments - Interactive */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          תגובות והערות
                        </Label>
                        
                        {/* Add Comment - Direct input like in client */}
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
                              onClick={handleCommentSubmit}
                              disabled={!newComment.trim()}
                              size="sm"
                            >
                              שלח
                            </Button>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {/* Comments Display - Exact same as client */}
                        <div className="max-h-48 overflow-y-auto">
                          {robustCommentsLoading ? (
                            <p className="text-sm text-gray-500">טוען תגובות...</p>
                          ) : robustComments && robustComments.length > 0 ? (
                            <div className="space-y-2">
                              {robustComments.map((comment) => (
                                <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
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
                        value={lead.next_follow_up_date ? lead.next_follow_up_date.split('T')[0] : ''}
                        onBlur={(e) => handleFieldBlur('next_follow_up_date', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, next_follow_up_date: e.target.value} : null)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        פרטי תזכורת
                      </Label>
                      <Input
                        value={lead.reminder_details || ''}
                        onBlur={(e) => handleFieldBlur('reminder_details', e.target.value)}
                        onChange={(e) => setLead(prev => prev ? {...prev, reminder_details: e.target.value} : null)}
                        className="mt-1"
                        placeholder="פרטי תזכורת או הנחיות מיוחדות"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="costs" className="p-6 space-y-6">
              {/* Financial Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    מידע כלכלי
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">סך כל העלויות (₪)</Label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">
                        <span className="text-lg font-semibold">
                          ₪{(
                            (
                              ((lead.ai_training_25_count || 0) * 2.5) +
                              ((lead.ai_training_15_count || 0) * 1.5) +
                              ((lead.ai_training_5_count || 0) * 5) +
                              ((lead.ai_prompts_count || 0) * 0.162)
                            ) * (lead.exchange_rate_at_conversion || 3.6)
                          ).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        סכום אימונים + פרומפטים בשקלים
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">עלויות AI כוללות (USD)</Label>
                      <p className="text-sm text-gray-600 mt-1">
                        ${lead.total_ai_costs?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">אימוני AI (2.5$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={lead.ai_training_25_count || ''}
                        onBlur={(e) => handleFieldBlur('ai_training_25_count', parseInt(e.target.value) || 0)}
                        onChange={(e) => setLead(prev => prev ? {...prev, ai_training_25_count: parseInt(e.target.value) || 0} : null)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">אימוני AI (1.5$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={lead.ai_training_15_count || ''}
                        onBlur={(e) => handleFieldBlur('ai_training_15_count', parseInt(e.target.value) || 0)}
                        onChange={(e) => setLead(prev => prev ? {...prev, ai_training_15_count: parseInt(e.target.value) || 0} : null)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">אימוני AI (5$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={lead.ai_training_5_count || ''}
                        onBlur={(e) => handleFieldBlur('ai_training_5_count', parseInt(e.target.value) || 0)}
                        onChange={(e) => setLead(prev => prev ? {...prev, ai_training_5_count: parseInt(e.target.value) || 0} : null)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">פרומפטים (0.162$)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={lead.ai_prompts_count || ''}
                        onBlur={(e) => handleFieldBlur('ai_prompts_count', parseInt(e.target.value) || 0)}
                        onChange={(e) => setLead(prev => prev ? {...prev, ai_prompts_count: parseInt(e.target.value) || 0} : null)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">הכנסות מליד (₪)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={lead.revenue_from_lead_local || ''}
                        onBlur={(e) => handleFieldBlur('revenue_from_lead_local', parseFloat(e.target.value) || 0)}
                        onChange={(e) => setLead(prev => prev ? {...prev, revenue_from_lead_local: parseFloat(e.target.value) || 0} : null)}
                        className="mt-1"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">שער המרה (₪/$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={lead.exchange_rate_at_conversion || ''}
                        onBlur={(e) => handleFieldBlur('exchange_rate_at_conversion', parseFloat(e.target.value) || 3.6)}
                        onChange={(e) => setLead(prev => prev ? {...prev, exchange_rate_at_conversion: parseFloat(e.target.value) || 3.6} : null)}
                        className="mt-1"
                        placeholder="3.60"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Time Tracking Section */}
              <WorkTimeTracker
                entityType="lead"
                entityId={lead.lead_id}
                totalWorkTimeMinutes={lead.total_work_time_minutes || 0}
              />
            </TabsContent>

            <TabsContent value="activity" className="p-6 space-y-6">
              {/* Activity and Comments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    תגובות ופעילות
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">הוסף תגובה</Label>
                    <div className="flex gap-2 mt-1">
                      <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="הזן תגובה חדשה..."
                        rows={3}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim()}
                        size="sm"
                      >
                        שלח
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">תגובות אחרונות</h4>
                    {commentsLoading ? (
                      <p className="text-sm text-gray-500">טוען תגובות...</p>
                    ) : comments && comments.length > 0 ? (
                      <div className="space-y-2">
                        {comments.map((comment) => (
                          <div key={comment.comment_id} className="p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">{comment.comment_text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(comment.comment_timestamp).toLocaleString('he-IL')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">אין תגובות</p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">היסטוריית פעילות</h4>
                    {activitiesLoading ? (
                      <p className="text-sm text-gray-500">טוען פעילות...</p>
                    ) : activities && activities.length > 0 ? (
                      <div className="space-y-2">
                        {activities.map((activity: ActivityLog) => (
                          <div key={activity.activity_id} className="p-3 bg-blue-50 rounded-md border-l-4 border-blue-200">
                            <p className="text-sm text-gray-700">{activity.activity_description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.activity_timestamp).toLocaleString('he-IL')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">אין היסטוריית פעילות</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="p-6">
              {/* Submissions Section */}
              <SubmissionsSection leadId={leadId} lead={lead} />
            </TabsContent>

            <TabsContent value="submissions2" className="p-0">
              {/* Enhanced Submissions Section */}
              {lead && <LeadSubmissions2 leadId={leadId} lead={lead} />}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
