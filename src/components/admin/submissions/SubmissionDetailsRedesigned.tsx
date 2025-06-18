import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Camera, 
  Sparkles, 
  Share, 
  Copy, 
  Save,
  Download,
  User,
  Calendar,
  Clock,
  MessageCircle,
  Bot,
  Upload
} from 'lucide-react';
import { SUBMISSION_STATUSES } from '@/types/submission';
import type { EnhancedSubmission } from '@/types/submission';
import { downloadImagesAsZip } from '@/utils/downloadUtils';
import { toast } from 'sonner';

export const SubmissionDetailsRedesigned: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [viewMode, setViewMode] = useState<'comparison' | 'grid' | 'gallery'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission', submissionId],
    queryFn: async () => {
      if (!submissionId) throw new Error('No submission ID');
      
      const { data, error } = await supabase
        .from('customer_submissions')
        .select(`
          submission_id,
          client_id,
          original_item_id,
          item_type,
          item_name_at_submission,
          assigned_package_id_at_submission,
          submission_status,
          uploaded_at,
          original_image_urls,
          processed_image_urls,
          main_processed_image_url,
          edit_history,
          edit_count,
          final_approval_timestamp,
          internal_team_notes,
          assigned_editor_id,
          priority,
          created_lead_id,
          submission_contact_name,
          submission_contact_email,
          submission_contact_phone,
          lead_id,
          created_at,
          "status_ממתינה_לעיבוד_at",
          "status_בעיבוד_at",
          "status_מוכנה_להצגה_at",
          "status_הערות_התקבלו_at",
          "status_הושלמה_ואושרה_at",
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .eq('submission_id', submissionId)
        .single();

      if (error) throw error;
      
      // Handle joined data that comes as arrays
      const processedData = {
        ...data,
        clients: Array.isArray(data.clients) && data.clients.length > 0 ? data.clients[0] : undefined,
        leads: Array.isArray(data.leads) && data.leads.length > 0 ? data.leads[0] : undefined
      };
      
      return processedData as unknown as EnhancedSubmission;
    },
    enabled: !!submissionId
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!submission) {
    return <div className="text-center py-8">הגשה לא נמצאה</div>;
  }

  const statusInfo = SUBMISSION_STATUSES[submission.submission_status as keyof typeof SUBMISSION_STATUSES];
  const contactInfo = submission.clients || submission.leads;

  // Handle download all original images
  const handleDownloadAllOriginalImages = async () => {
    if (!submission.original_image_urls || submission.original_image_urls.length === 0) {
      toast.error("אין תמונות מקור להורדה");
      return;
    }

    try {
      toast("מתחיל הורדת התמונות...", { duration: 2000 });
      const fileName = `${submission.item_name_at_submission || 'submission'}_original_images.zip`;
      await downloadImagesAsZip(submission.original_image_urls, fileName);
      toast.success(`הורדת ${submission.original_image_urls.length} תמונות הושלמה בהצלחה`);
    } catch (error) {
      console.error('Error downloading images:', error);
      toast.error("שגיאה בהורדת התמונות");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">{submission.item_name_at_submission}</h1>
              <Badge className={`${statusInfo.color} text-sm`}>
                {statusInfo.label}
              </Badge>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="שנה סטטוס" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBMISSION_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                ייצא
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 ml-1" />
                שתף
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 ml-1" />
                העתק
              </Button>
              <Button variant="default" size="sm">
                <Save className="h-4 w-4 ml-1" />
                שמור
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        
        {/* Images Section */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Original Images */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Camera className="h-5 w-5" />
                  תמונות מקור (שלח לי הלקוח)
                  {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                    <Badge variant="outline">{submission.original_image_urls.length}</Badge>
                  )}
                </CardTitle>
                {submission.original_image_urls && submission.original_image_urls.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAllOriginalImages}
                    className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">הורד הכל</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {submission.original_image_urls?.map((url, index) => (
                  <div key={index} className="aspect-square group relative">
                    <img
                      src={url}
                      alt={`תמונה מקור ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border transition-transform group-hover:scale-105"
                    />
                  </div>
                )) || (
                  <div className="col-span-full flex items-center justify-center h-32 text-gray-500 bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">אין תמונות מקור</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processed Images */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5" />
                                      תמונות מוכנות
                <Badge variant="outline">
                  {submission.processed_image_urls?.length || 0}
                </Badge>
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={viewMode === 'comparison' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('comparison')}
                >
                  השוואה
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  רשת
                </Button>
                <Button
                  variant={viewMode === 'gallery' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('gallery')}
                >
                  גלריה
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {submission.processed_image_urls?.map((url, index) => (
                  <div key={index} className="aspect-square group relative">
                    <img
                      src={url}
                      alt={`תמונה מעובדת ${index + 1}`}
                      className={`w-full h-full object-cover rounded-lg border-2 transition-transform group-hover:scale-105 ${
                        url === submission.main_processed_image_url
                          ? 'border-blue-500'
                          : 'border-gray-200'
                      }`}
                    />
                    {url === submission.main_processed_image_url && (
                      <Badge className="absolute top-2 right-2 bg-blue-500">
                        ראשית
                      </Badge>
                    )}
                  </div>
                )) || (
                  <div className="col-span-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">גרור תמונות או לחץ להעלאה</p>
                      <p className="text-xs text-gray-500 mt-1">להוספת תמונות מוכנות</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי הגשה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">סוג פריט</p>
                <p className="text-sm font-medium">{submission.item_type}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">תאריך העלאה</p>
                <p className="text-sm font-medium">
                  {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">עדיפות</p>
                <Badge variant="outline">{submission.priority || 'רגילה'}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">עורך מוקצה</p>
                <p className="text-sm font-medium">
                  {submission.assigned_editor_id || 'לא הוקצה'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">פרטי לקוח/ליד</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">שם מסעדה</p>
                  <p className="text-sm font-medium">
                    {contactInfo?.restaurant_name || 'לא זמין'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">איש קשר</p>
                <p className="text-sm font-medium">
                  {contactInfo?.contact_name || 'לא זמין'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">אימייל</p>
                <p className="text-sm font-medium">
                  {contactInfo?.email || 'לא זמין'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">טלפון</p>
                <p className="text-sm font-medium">
                  {contactInfo?.phone || 'לא זמין'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI & LoRA Settings */}
          <Card>
            <CardHeader className="bg-gray-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5" />
                הגדרות AI & LoRA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">שם LoRA</p>
                <p className="text-sm font-medium">
                  {submission.lora_name || 'לא הוגדר'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">מזהה LoRA</p>
                <p className="text-sm font-medium">
                  {submission.lora_id || 'לא הוגדר'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">קישור LoRA</p>
                <p className="text-sm font-medium break-all">
                  {submission.lora_link || 'לא הוגדר'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">פרומפט מותאם</p>
                <Textarea
                  value={submission.fixed_prompt || ''}
                  placeholder="הכנס פרומפט מותאם למטלה זו..."
                  className="min-h-[100px] text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מערכת הערות</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="internal" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="internal" className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  הערות פנימיות
                  <Badge variant="secondary" className="bg-red-100 text-red-800">3</Badge>
                </TabsTrigger>
                <TabsTrigger value="client" className="flex items-center gap-2">
                  הערות לקוח
                  <Badge variant="secondary" className="bg-green-100 text-green-800">1</Badge>
                </TabsTrigger>
                <TabsTrigger value="editor" className="flex items-center gap-2">
                  הערות עורך
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">2</Badge>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="internal" className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">מנהל המערכת</span>
                      <span className="text-xs text-gray-500">לפני 2 שעות</span>
                    </div>
                    <p className="text-sm">הגשה זו דורשת תשומת לב מיוחדת לפרטי הרקע</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="הוסף הערה פנימית..." className="flex-1" />
                  <Button>שלח</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="client" className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">לקוח</span>
                      <span className="text-xs text-gray-500">אתמול</span>
                    </div>
                    <p className="text-sm">התמונה נראית מעולה! תודה רבה</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="הוסף הערה ללקוח..." className="flex-1" />
                  <Button>שלח</Button>
                </div>
              </TabsContent>
              
              <TabsContent value="editor" className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">עורך ראשי</span>
                      <span className="text-xs text-gray-500">היום</span>
                    </div>
                    <p className="text-sm">עיבוד הושלם, מחכה לאישור סופי</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Textarea placeholder="הוסף הערת עורך..." className="flex-1" />
                  <Button>שלח</Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">טיימליין סטטוסים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">הושלמה ואושרה</h4>
                      <span className="text-xs text-gray-500">לפני 3 שעות</span>
                    </div>
                    <p className="text-sm text-gray-600">הגשה אושרה על ידי המנהל</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">מוכנה להצגה</h4>
                      <span className="text-xs text-gray-500">אתמול</span>
                    </div>
                    <p className="text-sm text-gray-600">עיבוד הושלם ונשלח ללקוח לבדיקה</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">בעיבוד</h4>
                      <span className="text-xs text-gray-500">לפני 2 ימים</span>
                    </div>
                    <p className="text-sm text-gray-600">הגשה הועברה לעיבוד על ידי העורך</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
