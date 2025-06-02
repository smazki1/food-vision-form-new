import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  X, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Calendar,
  Building2,
  FileText,
  BarChart3,
  MessageSquare,
  Clock,
  TrendingUp,
  Activity,
  Plus,
  Flag,
  Share,
  Store
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Lead, 
  LEAD_STATUS_DISPLAY, 
  LeadStatusEnum,
  mapLeadStatusToHebrew,
  mapHebrewToLeadStatusEnum
} from '@/types/lead';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { calculateTotalAICosts, convertUSDToILS } from '@/types/lead';
import { useUpdateLead, useAddLeadComment, useLeadActivities, LEAD_QUERY_KEY } from '@/hooks/useEnhancedLeads';
import { toast } from 'sonner';
import { FollowUpScheduler } from './FollowUpScheduler';
import { SmartBusinessTypeSelect } from './SmartBusinessTypeSelect';
import { SmartLeadSourceSelect } from './SmartLeadSourceSelect';

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
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');
  const [showFollowUpScheduler, setShowFollowUpScheduler] = useState(false);

  // Add new state for inline editing
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [updateCounter, setUpdateCounter] = useState(0);

  const queryClient = useQueryClient();
  const updateLead = useUpdateLead();
  const addComment = useAddLeadComment();

  // Fetch lead details
  const { data: lead, isLoading, error } = useQuery<Lead>({
    queryKey: ['lead', leadId],
    queryFn: async () => {
      console.log('Fetching lead data for leadId:', leadId);
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', leadId)
        .single();

      if (error) {
        throw error;
      }
      console.log('Fetched lead data:', data);
      return data as Lead;
    },
    enabled: !!leadId,
  });

  // Fetch lead activities and comments
  const { data: activities } = useLeadActivities(leadId);

  // Initialize edit data when lead is loaded
  React.useEffect(() => {
    if (lead && !editingField) {
      setTempValues(lead);
      
      // Debug status conversion
      console.log('Lead status from DB:', lead.lead_status);
      const enumStatus = mapHebrewToLeadStatusEnum(lead.lead_status as string);
      console.log('Converted to enum:', enumStatus);
      const backToHebrew = mapLeadStatusToHebrew(enumStatus as LeadStatusEnum);
      console.log('Back to Hebrew:', backToHebrew);
    }
  }, [lead, editingField]);

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error('אנא הזן הערה');
      return;
    }

    addComment.mutate(
      { lead_id: leadId, comment_text: newComment },
      {
        onSuccess: () => {
          toast.success('הערה נוספה בהצלחה');
          setNewComment('');
          queryClient.invalidateQueries({ queryKey: ['lead-activities', leadId] });
        },
        onError: (error) => {
          toast.error(`שגיאה בהוספת הערה: ${error.message}`);
        },
      }
    );
  };

  // Add auto-save function
  const handleFieldBlur = async (fieldName: string, value: any) => {
    console.log(`handleFieldBlur called for field: ${fieldName} with value:`, value);
    
    if (editingField === fieldName && tempValues[fieldName] !== undefined) {
      // Check if value actually changed
      const originalValue = lead?.[fieldName as keyof Lead];
      if (originalValue === value) {
        setEditingField(null);
        setTempValues({});
        return;
      }

      // Field-specific labels for messages
      const fieldLabels: Record<string, string> = {
        contact_name: 'שם איש הקשר',
        restaurant_name: 'שם המסעדה',
        phone: 'מספר טלפון',
        email: 'כתובת אימייל',
        business_type: 'סוג עסק',
        address: 'כתובת',
        website_url: 'אתר אינטרנט',
        notes: 'הערות',
        ai_training_25_count: 'אימונים $2.5',
        ai_training_15_count: 'אימונים $1.5',
        ai_training_5_count: 'אימונים $5.0',
        ai_prompts_count: 'פרומפטים',
        revenue_from_lead_local: 'הכנסות',
      };

      // Prepare update data with proper type conversion
      let processedValue = value;
      
      // Handle numeric fields
      if (['ai_training_25_count', 'ai_training_15_count', 'ai_training_5_count', 'ai_prompts_count'].includes(fieldName)) {
        processedValue = value ? parseInt(value.toString()) : 0;
      } else if (['revenue_from_lead_local'].includes(fieldName)) {
        processedValue = value ? parseFloat(value.toString()) : null;
      }
      
      // Special handling for lead_status - convert enum to Hebrew
      if (fieldName === 'lead_status') {
        processedValue = mapLeadStatusToHebrew(value as LeadStatusEnum);
        console.log(`Converting lead_status from ${value} to ${processedValue}`);
      }
      
      const updateData = { [fieldName]: processedValue, lead_id: leadId };
      
      try {
        console.log(`Auto-saving field ${fieldName} with value:`, processedValue);
        await updateLead.mutateAsync(updateData);
        
        // Force refresh the lead data to ensure UI updates
        await queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
        await queryClient.refetchQueries({ queryKey: ['lead', leadId] });
        
        // Also invalidate leads list to update table view - use LEAD_QUERY_KEY from useEnhancedLeads
        // This will invalidate all queries that start with the LEAD_QUERY_KEY
        await queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        await queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
        await queryClient.invalidateQueries({ queryKey: ['leads'] });
        await queryClient.invalidateQueries({ queryKey: ['archived-leads'] });
        
        setEditingField(null);
        setTempValues({});
        setUpdateCounter(prev => prev + 1);
        toast.success(`${fieldLabels[fieldName] || 'שדה'} עודכן בהצלחה`);
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error(`שגיאה בשמירת ${fieldLabels[fieldName] || fieldName}: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
        // Revert to original value on error
        setTempValues({});
        setEditingField(null);
      }
    } else {
      // For fields that don't use editing state (like Select dropdowns)
      console.log(`Direct save for field ${fieldName} with value:`, value);
      
      // Field-specific labels for messages
      const fieldLabels: Record<string, string> = {
        contact_name: 'שם איש הקשר',
        restaurant_name: 'שם המסעדה',
        phone: 'מספר טלפון',
        email: 'כתובת אימייל',
        business_type: 'סוג עסק',
        lead_status: 'סטטוס',
        lead_source: 'מקור ליד',
        address: 'כתובת',
        website_url: 'אתר אינטרנט',
        notes: 'הערות',
      };

      // Check if value actually changed
      const originalValue = lead?.[fieldName as keyof Lead];
      if (originalValue === value) {
        console.log(`No change detected for ${fieldName}, skipping save`);
        return;
      }

      // Special handling for lead_status - convert enum to Hebrew
      let processedValue = value;
      if (fieldName === 'lead_status') {
        processedValue = mapLeadStatusToHebrew(value as LeadStatusEnum);
        console.log(`Converting lead_status from ${value} to ${processedValue}`);
      }
      
      const updateData = { [fieldName]: processedValue, lead_id: leadId };
      
      try {
        console.log(`Direct saving field ${fieldName} with value:`, processedValue);
        await updateLead.mutateAsync(updateData);
        
        // Force refresh the lead data to ensure UI updates
        await queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
        await queryClient.refetchQueries({ queryKey: ['lead', leadId] });
        
        // Also invalidate leads list to update table view - use LEAD_QUERY_KEY from useEnhancedLeads
        // This will invalidate all queries that start with the LEAD_QUERY_KEY
        await queryClient.invalidateQueries({ queryKey: [LEAD_QUERY_KEY] });
        await queryClient.invalidateQueries({ queryKey: ['enhanced-leads'] });
        await queryClient.invalidateQueries({ queryKey: ['leads'] });
        await queryClient.invalidateQueries({ queryKey: ['archived-leads'] });
        
        setUpdateCounter(prev => prev + 1);
        toast.success(`${fieldLabels[fieldName] || 'שדה'} עודכן בהצלחה`);
      } catch (error) {
        console.error('Direct save failed:', error);
        toast.error(`שגיאה בשמירת ${fieldLabels[fieldName] || fieldName}: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
      }
    }
  };

  // Add inline edit field component
  const InlineEditField = ({ 
    fieldName, 
    value, 
    type = 'text',
    placeholder,
    options = null,
    multiline = false,
    min,
    step 
  }: {
    fieldName: string;
    value: any;
    type?: string;
    placeholder?: string;
    options?: Array<{key: string, value: string}> | null;
    multiline?: boolean;
    min?: string;
    step?: string;
  }) => {
    const isEditing = editingField === fieldName;
    const currentValue = isEditing ? (tempValues[fieldName] ?? value) : value;

    // Debug logging
    React.useEffect(() => {
      console.log(`InlineEditField [${fieldName}] - value: ${value}, currentValue: ${currentValue}, isEditing: ${isEditing}`);
    }, [fieldName, value, currentValue, isEditing]);

    // Reset editing state if value changes from outside while editing
    React.useEffect(() => {
      if (isEditing && tempValues[fieldName] !== undefined) {
        // If external value changed while we're editing, reset editing state
        const originalValue = lead?.[fieldName as keyof Lead];
        if (originalValue !== value && originalValue === tempValues[fieldName]) {
          setEditingField(null);
          setTempValues({});
        }
      }
    }, [value, isEditing, fieldName, tempValues, lead]);

    const handleClick = () => {
      setEditingField(fieldName);
      setTempValues({ [fieldName]: value || '' });
    };

    const handleChange = (newValue: any) => {
      setTempValues({ ...tempValues, [fieldName]: newValue });
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        handleFieldBlur(fieldName, currentValue);
      } else if (e.key === 'Escape') {
        setEditingField(null);
        setTempValues({});
      }
    };

    if (isEditing) {
      if (options) {
        return (
          <Select 
            value={currentValue} 
            onValueChange={(value) => {
              handleChange(value);
              handleFieldBlur(fieldName, value);
            }}
            open={true}
          >
            <SelectTrigger className="h-auto min-h-[32px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.key} value={option.key}>
                  {option.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      } else if (multiline) {
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => handleFieldBlur(fieldName, currentValue)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="min-h-[80px]"
            autoFocus
          />
        );
      } else {
        return (
          <Input
            type={type}
            value={currentValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={() => handleFieldBlur(fieldName, currentValue)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            min={min}
            step={step}
            autoFocus
          />
        );
      }
    }

    return (
      <div 
        onClick={handleClick}
        className="cursor-pointer hover:bg-muted/30 p-2 rounded border-2 border-transparent hover:border-muted transition-colors min-h-[36px] flex items-center"
      >
        {currentValue || <span className="text-muted-foreground">{placeholder || 'לחץ לעריכה'}</span>}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-[50vw] max-w-[800px] min-w-[600px] overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">טוען פרטי ליד...</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (error || !lead) {
    return (
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-[50vw] max-w-[800px] min-w-[600px] overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-red-600">שגיאה בטעינת פרטי הליד</p>
              <Button variant="outline" onClick={onClose} className="mt-2">
                סגור
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const totalCostsUSD = calculateTotalAICosts(lead);
  const totalCostsILS = convertUSDToILS(totalCostsUSD);

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent className="w-[50vw] max-w-[800px] min-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl">{lead.restaurant_name}</SheetTitle>
              <SheetDescription className="mt-1">
                פרטי ליד • נוצר {formatDate(lead.created_at)}
              </SheetDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">פרטים</TabsTrigger>
              <TabsTrigger value="costs">עלויות</TabsTrigger>
              <TabsTrigger value="activity">פעילות</TabsTrigger>
              <TabsTrigger value="follow-up">מעקב</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              {/* Status and Source - Always visible */}
              <div className="flex gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <Badge 
                    variant="default" 
                    className="bg-primary/10 text-primary border-primary/20"
                  >
                    {LEAD_STATUS_DISPLAY[lead.lead_status as keyof typeof LEAD_STATUS_DISPLAY]}
                  </Badge>
                </div>
                {lead.lead_source && (
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline">
                      {lead.lead_source}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">פרטי קשר</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">שם מסעדה</Label>
                        <Input
                          value={lead.restaurant_name}
                          onChange={(e) => handleFieldBlur('restaurant_name', e.target.value)}
                          placeholder="שם מסעדה"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">איש קשר</Label>
                        <Input
                          value={lead.contact_name}
                          onChange={(e) => handleFieldBlur('contact_name', e.target.value)}
                          placeholder="איש קשר"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">טלפון</Label>
                        <Input
                          type="tel"
                          value={lead.phone}
                          onChange={(e) => handleFieldBlur('phone', e.target.value)}
                          placeholder="טלפון"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">אימייל</Label>
                        <Input
                          type="email"
                          value={lead.email}
                          onChange={(e) => handleFieldBlur('email', e.target.value)}
                          placeholder="אימייל"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">סוג עסק</Label>
                        <SmartBusinessTypeSelect
                          value={lead.business_type || ''}
                          onValueChange={(value) => {
                            handleFieldBlur('business_type', value);
                          }}
                          placeholder="בחר סוג עסק"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">כתובת</Label>
                        <Textarea
                          value={lead.address || ''}
                          onChange={(e) => handleFieldBlur('address', e.target.value)}
                          placeholder="כתובת"
                          className="mt-1 min-h-[60px]"
                        />
                      </div>
                    </div>
                  
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm text-muted-foreground">אתר אינטרנט</Label>
                        <Input
                          value={lead.website_url || ''}
                          onChange={(e) => handleFieldBlur('website_url', e.target.value)}
                          placeholder="אתר אינטרנט"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Status and Source editing fields - always visible */}
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Flag className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">סטטוס</Label>
                          <Select
                            value={mapHebrewToLeadStatusEnum(lead.lead_status as string) || lead.lead_status}
                            onValueChange={(value) => {
                              console.log('Status Select onValueChange - selected value:', value);
                              handleFieldBlur('lead_status', value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(LEAD_STATUS_DISPLAY).map(([key, display]) => (
                                <SelectItem key={key} value={key}>
                                  {display}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <Share className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">מקור</Label>
                          <SmartLeadSourceSelect
                            value={lead.lead_source || ''}
                            onValueChange={(value) => {
                              handleFieldBlur('lead_source', value);
                            }}
                            placeholder="בחר מקור ליד"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes field - always visible and editable */}
                    <div className="border-t pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <Label className="text-sm text-muted-foreground">הערות</Label>
                          <Textarea
                            value={lead.notes || ''}
                            onChange={(e) => handleFieldBlur('notes', e.target.value)}
                            placeholder="הערות"
                            className="mt-1 min-h-[80px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Free Taste Package */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">חבילת טעימה חינמית</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={lead.free_sample_package_active ? "default" : "secondary"}>
                        {lead.free_sample_package_active ? 'פעילה' : 'לא פעילה'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {lead.free_sample_package_active ? 
                          'הלקוח זכאי לחבילת טעימה חינמית' : 
                          'חבילת טעימה לא מופעלת'
                        }
                      </span>
                    </div>
                    <Button
                      variant={lead.free_sample_package_active ? "destructive" : "default"}
                      size="sm"
                      onClick={async () => {
                        try {
                          const newStatus = !lead.free_sample_package_active;
                          await handleFieldBlur('free_sample_package_active', newStatus);
                          toast.success(
                            newStatus ? 
                              'חבילת טעימה חינמית הופעלה בהצלחה' : 
                              'חבילת טעימה חינמית בוטלה'
                          );
                        } catch (error) {
                          toast.error('שגיאה בעדכון חבילת הטעימה');
                        }
                      }}
                    >
                      {lead.free_sample_package_active ? 'בטל חבילה' : 'הפעל חבילה'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Costs Tab */}
            <TabsContent value="costs" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    עלויות ונתונים כלכליים
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(totalCostsILS, 'he-IL', 'ILS')}
                      </div>
                      <div className="text-sm text-muted-foreground">עלויות AI (₪)</div>
                      <div className="text-xs text-muted-foreground">
                        ${totalCostsUSD.toFixed(2)} USD
                      </div>
                    </div>
                    {lead.roi !== null && lead.roi !== undefined && (
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className={`text-2xl font-bold ${lead.roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {lead.roi.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">ROI</div>
                      </div>
                    )}
                  </div>

                  {/* AI Cost Management */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">ניהול עלויות AI</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>אימונים ($2.5)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={lead.ai_training_25_count || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleFieldBlur('ai_training_25_count', value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>אימונים ($1.5)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={lead.ai_training_15_count || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleFieldBlur('ai_training_15_count', value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>אימונים ($5.0)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={lead.ai_training_5_count || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleFieldBlur('ai_training_5_count', value);
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>פרומפטים ($0.16)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={lead.ai_prompts_count || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleFieldBlur('ai_prompts_count', value);
                          }}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Revenue Management */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">ניהול הכנסות</h4>
                    <div>
                      <Label>הכנסות מהליד (₪)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lead.revenue_from_lead_local || 0}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          handleFieldBlur('revenue_from_lead_local', value);
                        }}
                        className="mt-1"
                      />
                    </div>
                    {lead.revenue_from_lead_local && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">הכנסות נוכחיות:</span>
                          <span className="font-bold text-green-600">
                            {formatCurrency(lead.revenue_from_lead_local, 'he-IL', 'ILS')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6 mt-6">
              {/* Add Comment */}
              {!isArchiveView && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      הוסף הערה
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="כתוב הערה או עדכון על הליד..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={addComment.isPending || !newComment.trim()}
                    >
                      <MessageSquare className="h-4 w-4 ml-1" />
                      הוסף הערה
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    היסטוריית פעילות
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activities && activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((activity) => (
                        <div key={activity.activity_id} className="border-l-2 border-muted pl-4 pb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(activity.activity_timestamp)}
                          </div>
                          <p className="mt-1">{activity.activity_description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>אין פעילות עדיין</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Follow-up Tab */}
            <TabsContent value="follow-up" className="space-y-6 mt-6">
              {/* Follow-up Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      מעקב ותזכורות
                    </CardTitle>
                    {!isArchiveView && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFollowUpScheduler(true)}
                      >
                        <Calendar className="h-4 w-4 ml-1" />
                        קבע מעקב
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lead.next_follow_up_date ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{formatDate(lead.next_follow_up_date)}</p>
                        <p className="text-sm text-muted-foreground">תאריך מעקב הבא</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>לא נקבע מועד למעקב</p>
                    </div>
                  )}
                  
                  {lead.next_follow_up_notes && (
                    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{lead.next_follow_up_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Follow-up Scheduler Modal */}
        {showFollowUpScheduler && (
          <FollowUpScheduler
            lead={lead}
            isOpen={showFollowUpScheduler}
            onClose={() => setShowFollowUpScheduler(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};