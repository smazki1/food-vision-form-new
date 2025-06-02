import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  useUpdateLead, 
  useAddLeadComment, 
  useLeadActivities,
  LEAD_QUERY_KEY 
} from '@/hooks/useEnhancedLeads';
import { 
  Lead, 
  LeadStatusEnum, 
  LEAD_STATUS_DISPLAY,
  calculateTotalAICosts,
  convertUSDToILS
} from '@/types/lead';
import { SubmissionsSection } from './SubmissionsSection';
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
  Building
} from 'lucide-react';

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

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  leadId,
  onClose,
  isArchiveView = false
}) => {
  const [lead, setLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();
  
  const updateLeadMutation = useUpdateLead();
  const addCommentMutation = useAddLeadComment();
  const { data: activities, isLoading: activitiesLoading } = useLeadActivities(leadId);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const data = queryClient.getQueryData<any>([LEAD_QUERY_KEY])?.data;
        const foundLead = data?.find((l: Lead) => l.lead_id === leadId);
        setLead(foundLead || null);
      } catch (error) {
        console.error('Failed to fetch lead:', error);
        toast.error('Failed to fetch lead details');
        setLead(null);
      }
    };

    if (leadId) {
      fetchLead();
    }
  }, [leadId, queryClient]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !lead) return;

    try {
      await addCommentMutation.mutateAsync({
        leadId: lead.lead_id,
        comment: newComment
      });
      setNewComment('');
      toast.success('התגובה נוספה בהצלחה');
    } catch (error) {
      toast.error('שגיאה בהוספת התגובה');
    }
  };

  const handleSave = async (fieldName: string, value: any) => {
    if (!lead) return;

    try {
      const updates = { [fieldName]: value };
      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates
      });
      toast.success('השדה עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון השדה');
    }
  };

  const handleSaveStatus = async (fieldName: string, value: any) => {
    if (!lead) return;
  
    try {
      const updates = { [fieldName]: value as LeadStatusEnum };
      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates
      });
      toast.success('הסטטוס עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון הסטטוס');
    }
  };

  const handleSaveNotes = async (fieldName: string, value: any) => {
    if (!lead) return;

    try {
      const updates = { [fieldName]: value };
      await updateLeadMutation.mutateAsync({
        leadId: lead.lead_id,
        updates
      });
      toast.success('השדה עודכן בהצלחה');
    } catch (error) {
      toast.error('שגיאה בעדכון השדה');
    }
  };

  if (!lead) {
    return (
      <Sheet open={!!leadId} onOpenChange={onClose}>
        <SheetContent 
          side="left" 
          className="w-[90vw] max-w-[1000px] sm:max-w-[1000px] p-6"
        >
          <SheetHeader>
            <SheetTitle>פרטי ליד</SheetTitle>
          </SheetHeader>
          <p>טוען פרטי ליד...</p>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={!!leadId} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
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
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)] p-6">
          <div className="space-y-6">
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
                    <p className="text-sm text-gray-600">{lead.restaurant_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">איש קשר</Label>
                    <p className="text-sm text-gray-600">{lead.contact_name}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">טלפון</Label>
                    <p className="text-sm text-gray-600">
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:underline">
                        <Phone className="h-4 w-4 mr-1" />
                        {lead.phone}
                      </a>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">אימייל</Label>
                    <p className="text-sm text-gray-600">
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:underline">
                        <Mail className="h-4 w-4 mr-1" />
                        {lead.email}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-medium">אתר</Label>
                    <p className="text-sm text-gray-600">
                      {lead.website_url ? (
                        <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                          <Globe className="h-4 w-4 mr-1" />
                          {lead.website_url}
                        </a>
                      ) : (
                        'לא צוין'
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">כתובת</Label>
                    <p className="text-sm text-gray-600">
                      {lead.address ? (
                        <a href={`https://www.google.com/maps/search/${encodeURIComponent(lead.address)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                          <MapPin className="h-4 w-4 mr-1" />
                          {lead.address}
                        </a>
                      ) : (
                        'לא צוין'
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">סוג עסק</Label>
                    <p className="text-sm text-gray-600">{lead.business_type || 'לא צוין'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                    <Label className="text-sm font-medium">ROI</Label>
                    <p className="text-sm font-bold text-green-600">
                      {lead.roi !== undefined && lead.roi !== null ? `${lead.roi.toFixed(2)}%` : 'לא חושב'}
                    </p>
                    {lead.roi !== undefined && lead.roi !== null && (
                      <p className="text-xs text-gray-500">
                        החזר השקעה: {lead.roi > 0 ? 'חיובי' : 'שלילי'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">עלויות AI כוללות</Label>
                    <p className="text-sm text-gray-600">
                      ${lead.total_ai_costs?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">אימוני AI (25$)</Label>
                    <p className="text-sm text-gray-600">
                      {lead.ai_training_25_count || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">אימוני AI (15$)</Label>
                    <p className="text-sm text-gray-600">
                      {lead.ai_training_15_count || 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">אימוני AI (5$)</Label>
                    <p className="text-sm text-gray-600">
                      {lead.ai_training_5_count || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">הכנסות מליד (₪)</Label>
                    <p className="text-sm text-gray-600">
                      ₪{lead.revenue_from_lead_local?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">שער המרה</Label>
                    <p className="text-sm text-gray-600">{lead.exchange_rate_at_conversion?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status and Follow-Up Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  סטטוס וטיפול
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">סטטוס</Label>
                    <Select
                      onValueChange={(value) => handleSaveStatus('lead_status', value)}
                      defaultValue={lead.lead_status}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="בחר סטטוס" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LEAD_STATUS_DISPLAY).map(([key, value]) => (
                          <SelectItem key={key} value={key as LeadStatusEnum}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">תזכורת הבאה</Label>
                    <p className="text-sm text-gray-600">
                      {lead.next_follow_up_date ? (
                        <>
                          <Calendar className="h-4 w-4 inline-block mr-1" />
                          {new Date(lead.next_follow_up_date).toLocaleDateString('he-IL')}
                        </>
                      ) : (
                        'לא נקבעה'
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Comments Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  הערות ותגובות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">הערות</Label>
                  <Textarea
                    placeholder="הוסף הערות..."
                    value={lead.notes || ''}
                    onChange={(e) => handleSaveNotes('notes', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">הוסף תגובה</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="הוסף תגובה..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-grow"
                    />
                    <Button onClick={handleCommentSubmit}>שלח</Button>
                  </div>
                </div>
                <Separator className="my-2" />
                <div>
                  <h4 className="text-sm font-medium">תגובות אחרונות</h4>
                  {activitiesLoading ? (
                    <p className="text-sm text-gray-500">טוען תגובות...</p>
                  ) : activities && activities.length > 0 ? (
                    activities.map((activity: ActivityLog) => (
                      <div key={activity.activity_id} className="mb-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-700">{activity.activity_description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.activity_timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">אין תגובות</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submissions Section */}
            <SubmissionsSection leadId={leadId} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
