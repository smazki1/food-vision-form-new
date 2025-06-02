import React, { useState } from 'react';
import { useLeadDetails, useAddLeadComment, useUpdateLead, useConvertLeadToClient } from '@/hooks/useEnhancedLeads';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  X, 
  UserPlus, 
  User, 
  Calendar, 
  MessageCircle, 
  History, 
  Link as LinkIcon, 
  Globe, 
  MapPin, 
  Mail, 
  Phone, 
  DollarSign, 
  Percent
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { formatDate, formatDateTime, formatCurrency } from '@/utils/formatters';
import { LeadStatusEnum, LEAD_STATUS_DISPLAY } from '@/types/lead';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAddLeadActivity, useAIPricingSettings } from '@/hooks/useEnhancedLeads';

interface LeadDetailPanelProps {
  leadId: string;
  onClose: () => void;
  isArchiveView?: boolean;
}

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  leadId,
  onClose,
  isArchiveView = false,
}) => {
  const { data: leadDetails, isLoading, error } = useLeadDetails(leadId);
  const addComment = useAddLeadComment();
  const updateLead = useUpdateLead();
  const convertToClient = useConvertLeadToClient();
  const addActivity = useAddLeadActivity();
  const aipricingSettings = useAIPricingSettings();
  
  const [newComment, setNewComment] = useState('');
  const [aiTrainingsCount, setAiTrainingsCount] = useState<number | ''>('');
  const [aiTrainingCostPerUnit, setAiTrainingCostPerUnit] = useState<number | ''>('');
  const [aiPromptsCount, setAiPromptsCount] = useState<number | ''>('');
  const [aiPromptCostPerUnit, setAiPromptCostPerUnit] = useState<number | ''>('');
  const [revenueLocal, setRevenueLocal] = useState<number | ''>('');
  const [exchangeRate, setExchangeRate] = useState<number | ''>('');
  const [reminderDate, setReminderDate] = useState<string>('');

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('אנא הזן הערה');
      return;
    }
    
    addComment.mutate({
      leadId,
      commentText: newComment,
    }, {
      onSuccess: () => {
        setNewComment('');
      }
    });
  };
  
  const handleUpdateAiCosts = () => {
    const updates: any = {};
    
    if (aiTrainingsCount !== '') {
      updates.ai_trainings_count = Number(aiTrainingsCount);
    }
    
    if (aiTrainingCostPerUnit !== '') {
      updates.ai_training_cost_per_unit = Number(aiTrainingCostPerUnit);
    }
    
    if (aiPromptsCount !== '') {
      updates.ai_prompts_count = Number(aiPromptsCount);
    }
    
    if (aiPromptCostPerUnit !== '') {
      updates.ai_prompt_cost_per_unit = Number(aiPromptCostPerUnit);
    }
    
    if (Object.keys(updates).length === 0) {
      toast.error('לא בוצעו שינויים');
      return;
    }
    
    updateLead.mutate({
      leadId,
      updates
    }, {
      onSuccess: () => {
        toast.success('עלויות AI עודכנו בהצלחה');
      }
    });
  };
  
  const handleUpdateRevenue = () => {
    const updates: any = {};
    
    if (revenueLocal !== '') {
      updates.revenue_from_lead_local = Number(revenueLocal);
    }
    
    if (exchangeRate !== '') {
      updates.exchange_rate_at_conversion = Number(exchangeRate);
    }
    
    if (Object.keys(updates).length === 0) {
      toast.error('לא בוצעו שינויים');
      return;
    }
    
    updateLead.mutate({
      leadId,
      updates
    }, {
      onSuccess: () => {
        toast.success('נתוני הכנסות עודכנו בהצלחה');
      }
    });
  };
  
  const handleUpdateReminder = () => {
    if (!reminderDate) {
      toast.error('אנא בחר תאריך לתזכורת');
      return;
    }
    
    updateLead.mutate({
      leadId,
      updates: {
        next_follow_up_date: reminderDate
      }
    }, {
      onSuccess: () => {
        toast.success('תזכורת נקבעה בהצלחה');
      }
    });
  };
  
  const handleStatusChange = (newStatus: LeadStatusEnum) => {
    updateLead.mutate({
      leadId,
      updates: {
        status: newStatus
      }
    }, {
      onSuccess: () => {
        toast.success(`סטטוס עודכן ל${LEAD_STATUS_DISPLAY[newStatus]}`);
      }
    });
  };
  
  const handleConvertToClient = () => {
    if (confirm('האם אתה בטוח שברצונך להמיר ליד זה ללקוח?')) {
      convertToClient.mutate(leadId, {
        onSuccess: (clientId) => {
          toast.success('הליד הומר ללקוח בהצלחה! מזהה לקוח: ' + clientId);
          setTimeout(onClose, 1500); // Close panel after success message
        }
      });
    }
  };
  
  if (isLoading) {
    return (
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-md" side="left">
          <div className="w-full h-full flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  if (error || !leadDetails) {
    return (
      <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-md" side="left">
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-red-500">שגיאה בטעינת פרטי הליד</p>
            <Button onClick={onClose} className="mt-4">סגור</Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-md overflow-y-auto" side="left">
        <SheetHeader className="text-right border-b pb-4">
          <div className="flex justify-between items-start">
            <Button variant="ghost" size="sm" onClick={onClose} className="mt-1">
              <X size={16} />
            </Button>
            <div>
              <SheetTitle className="text-xl font-bold">{leadDetails.restaurant_name}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground text-right">
                צפה ונהל פרטי ליד, עלויות, הערות והיסטוריית פעילות.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-6">
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="details">פרטים</TabsTrigger>
              <TabsTrigger value="ai-costs">AI עלויות</TabsTrigger>
              <TabsTrigger value="comments">הערות</TabsTrigger>
              <TabsTrigger value="activity">היסטוריה</TabsTrigger>
            </TabsList>
            
            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {LEAD_STATUS_DISPLAY[leadDetails.status as LeadStatusEnum]}
                  </div>
                  
                  {!isArchiveView && leadDetails.status !== LeadStatusEnum.CONVERTED_TO_CLIENT && (
                    <Button 
                      variant="default"
                      size="sm"
                      className="gap-1"
                      onClick={handleConvertToClient}
                    >
                      <UserPlus size={16} />
                      המר ללקוח
                    </Button>
                  )}
                </div>
                
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">פרטי קשר</h3>
                  
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    <span>{leadDetails.contact_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    <a href={`tel:${leadDetails.phone}`} className="text-blue-600 hover:underline">
                      {leadDetails.phone}
                    </a>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    <a href={`mailto:${leadDetails.email}`} className="text-blue-600 hover:underline">
                      {leadDetails.email}
                    </a>
                  </div>
                  
                  {leadDetails.website_url && (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-gray-500" />
                      <a 
                        href={leadDetails.website_url.startsWith('http') ? leadDetails.website_url : `https://${leadDetails.website_url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {leadDetails.website_url}
                      </a>
                    </div>
                  )}
                  
                  {leadDetails.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-gray-500" />
                      <span>{leadDetails.address}</span>
                    </div>
                  )}
                </div>
                
                {!isArchiveView && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">עדכון סטטוס</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(LEAD_STATUS_DISPLAY)
                        .filter(([status]) => status !== LeadStatusEnum.ARCHIVED && status !== leadDetails.status)
                        .map(([status, label]) => (
                          <Button
                            key={status}
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(status as LeadStatusEnum)}
                          >
                            {label}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
                
                {!isArchiveView && (
                  <div className="border rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold">קביעת תזכורת</h3>
                    <div className="space-y-3">
                      <div>
                        <Label>תאריך תזכורת</Label>
                        <Input
                          type="date"
                          value={reminderDate || (leadDetails.next_follow_up_date ? leadDetails.next_follow_up_date.split('T')[0] : '')}
                          onChange={(e) => setReminderDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <Button onClick={handleUpdateReminder} className="w-full">
                        {leadDetails.next_follow_up_date ? 'עדכן תזכורת' : 'קבע תזכורת'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold">פרטים נוספים</h3>
                  
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span>נוצר: {formatDate(leadDetails.created_at)}</span>
                  </div>
                  
                  {leadDetails.lead_source && (
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-gray-500" />
                      <span>מקור: {leadDetails.lead_source}</span>
                    </div>
                  )}
                  
                  {leadDetails.notes && (
                    <div className="mt-2">
                      <Label className="text-gray-500">הערות:</Label>
                      <p className="mt-1 whitespace-pre-wrap">{leadDetails.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* AI Costs Tab */}
            <TabsContent value="ai-costs" className="space-y-6">
              <div className="space-y-4">
                <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <h3 className="font-semibold">סיכום עלויות</h3>
                  
                  <div className="flex justify-between items-center py-1 border-b">
                    <span>סה"כ עלות AI:</span>
                    <span className="font-semibold">{formatCurrency(leadDetails.total_ai_costs)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b">
                    <span>הכנסה (מקומי):</span>
                    <span className="font-semibold">{formatCurrency(leadDetails.revenue_from_lead_local, 'he-IL', 'ILS')}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1 border-b">
                    <span>הכנסה (USD):</span>
                    <span className="font-semibold">{formatCurrency(leadDetails.revenue_from_lead_usd)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-1">
                    <span>ROI:</span>
                    <span className={`font-semibold ${(leadDetails.roi || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {leadDetails.roi !== null && leadDetails.roi !== undefined
                        ? `${leadDetails.roi.toFixed(0)}%`
                        : '-'}
                    </span>
                  </div>
                </div>
                
                {!isArchiveView && (
                  <>
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">עדכון עלויות AI</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>מספר אימונים</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder={leadDetails.ai_trainings_count?.toString() || '0'}
                            value={aiTrainingsCount === '' ? '' : aiTrainingsCount}
                            onChange={(e) => setAiTrainingsCount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>עלות ליחידה ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder={leadDetails.ai_training_cost_per_unit?.toString() || '1.5'}
                            value={aiTrainingCostPerUnit === '' ? '' : aiTrainingCostPerUnit}
                            onChange={(e) => setAiTrainingCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>מספר Prompts</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder={leadDetails.ai_prompts_count?.toString() || '0'}
                            value={aiPromptsCount === '' ? '' : aiPromptsCount}
                            onChange={(e) => setAiPromptsCount(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>עלות Prompt ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={leadDetails.ai_prompt_cost_per_unit?.toString() || '0.16'}
                            value={aiPromptCostPerUnit === '' ? '' : aiPromptCostPerUnit}
                            onChange={(e) => setAiPromptCostPerUnit(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={handleUpdateAiCosts} className="w-full">
                        עדכן עלויות AI
                      </Button>
                    </div>
                    
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-semibold">עדכון הכנסות</h3>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>הכנסה (מקומי)</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder={leadDetails.revenue_from_lead_local?.toString() || '0'}
                            value={revenueLocal === '' ? '' : revenueLocal}
                            onChange={(e) => setRevenueLocal(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label>שער המרה לדולר</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder={leadDetails.exchange_rate_at_conversion?.toString() || '3.65'}
                            value={exchangeRate === '' ? '' : exchangeRate}
                            onChange={(e) => setExchangeRate(e.target.value === '' ? '' : Number(e.target.value))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <Button onClick={handleUpdateRevenue} className="w-full">
                        עדכן הכנסות
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
            
            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4">
              {!isArchiveView && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="הוסף הערה חדשה..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={addComment.isPending}
                    className="w-full"
                  >
                    {addComment.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                    הוסף הערה
                  </Button>
                </div>
              )}
              
              <div className="space-y-4 mt-4">
                {leadDetails.comments && leadDetails.comments.length > 0 ? (
                  leadDetails.comments.map((comment) => (
                    <div key={comment.comment_id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-500">
                          {formatDateTime(comment.comment_timestamp)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="mx-auto h-8 w-8 opacity-50 mb-2" />
                    <p>אין הערות עדיין</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <div className="space-y-4">
                {leadDetails.activities && leadDetails.activities.length > 0 ? (
                  leadDetails.activities.map((activity) => (
                    <div key={activity.activity_id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-gray-500">
                          {formatDateTime(activity.activity_timestamp)}
                        </span>
                      </div>
                      <p className="mt-1">{activity.activity_description}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <History className="mx-auto h-8 w-8 opacity-50 mb-2" />
                    <p>אין פעילות עדיין</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}; 