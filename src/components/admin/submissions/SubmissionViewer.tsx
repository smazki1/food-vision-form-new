import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  SubmissionCommentType,
  ImageViewMode,
  SUBMISSION_STATUSES,
  SubmissionStatusKey
} from '@/types/submission';

// Custom hooks
import {
  useSubmission,
  useSubmissionComments,
  useUpdateSubmissionStatus,
  useUpdateSubmissionLora,
  useAddSubmissionComment
} from '@/hooks/useSubmissions';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Icons
import {
  Camera,
  Sparkles,
  Download,
  Share,
  Copy,
  Save,
  Upload,
  User,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  Wand2,
} from 'lucide-react';

interface SubmissionViewerProps {
  submissionId: string;
  viewMode: 'admin' | 'client' | 'editor';
  context: 'lead-panel' | 'full-page' | 'table-row' | 'client-dashboard';
  onClose?: () => void;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  submissionId,
  viewMode,
  context,
  onClose
}) => {
  // State management
  const [imageViewMode, setImageViewMode] = useState<ImageViewMode>('comparison');
  const [activeCommentTab, setActiveCommentTab] = useState<SubmissionCommentType>('admin_internal');
  const [newComment, setNewComment] = useState('');
  const [editingLoraFields, setEditingLoraFields] = useState(false);
  const [loraData, setLoraData] = useState({
    lora_link: '',
    lora_name: '',
    fixed_prompt: ''
  });

  // Custom hooks
  const { data: submission, isLoading, error } = useSubmission(submissionId);
  const { data: comments = [] } = useSubmissionComments(submissionId);
  const updateStatusMutation = useUpdateSubmissionStatus();
  const updateLoraMutation = useUpdateSubmissionLora();
  const addCommentMutation = useAddSubmissionComment();

  // Initialize LoRA data when submission loads
  useEffect(() => {
    if (submission) {
      setLoraData({
        lora_link: '',
        lora_name: '',
        fixed_prompt: ''
      });
    }
  }, [submission]);

  // Handle status update
  const handleStatusUpdate = (newStatus: SubmissionStatusKey) => {
    updateStatusMutation.mutate({ submissionId, status: newStatus });
  };

  // Handle LoRA update
  const handleLoraUpdate = () => {
    updateLoraMutation.mutate({ submissionId, loraData });
    setEditingLoraFields(false);
  };

  // Handle comment submission
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    const visibility = activeCommentTab === 'client_visible' ? 'client' : 'admin';
    addCommentMutation.mutate({
      submissionId,
      commentType: activeCommentTab,
      commentText: newComment,
      visibility
    });
    setNewComment('');
  };

  // Get comments by type
  const getCommentsByType = (type: SubmissionCommentType) => {
    return comments.filter(comment => comment.comment_type === type);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (error || !submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">שגיאה בטעינת פרטי ההגשה</p>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="mt-2">
              סגור
            </Button>
          )}
        </div>
      </div>
    );
  }

  const statusInfo = SUBMISSION_STATUSES[submission.submission_status as SubmissionStatusKey];

  return (
    <div className={`min-h-screen bg-gray-50 ${context === 'lead-panel' ? 'max-h-screen overflow-y-auto' : ''}`}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {submission.item_name_at_submission}
              </h1>
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
              {viewMode === 'admin' && (
                <Select
                  value={submission.submission_status}
                  onValueChange={handleStatusUpdate}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SUBMISSION_STATUSES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 ml-2" />
                ייצא
              </Button>
              <Button variant="outline" size="sm">
                <Share className="h-4 w-4 ml-2" />
                שתף
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="h-4 w-4 ml-2" />
                שכפל
              </Button>
              <Button 
                size="sm"
                onClick={handleLoraUpdate}
                disabled={!editingLoraFields || updateLoraMutation.isPending}
              >
                <Save className="h-4 w-4 ml-2" />
                שמור
              </Button>
              {onClose && (
                <Button variant="ghost" onClick={onClose}>
                  <span className="sr-only">סגור</span>
                  ×
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Images Section - Most Important */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                תמונות המנה
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant={imageViewMode === 'comparison' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('comparison')}
                >
                  השוואה
                </Button>
                <Button
                  variant={imageViewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('grid')}
                >
                  רשת
                </Button>
                <Button
                  variant={imageViewMode === 'gallery' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageViewMode('gallery')}
                >
                  גלריה
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-6 ${imageViewMode === 'comparison' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              
              {/* Original Images Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-gray-600" />
                  <h3 className="font-semibold">תמונות מקור</h3>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                  {submission.original_image_urls?.map((url, index) => (
                    <div key={index} className="aspect-square bg-white rounded-lg border-2 border-gray-200 overflow-hidden hover:scale-105 transition-transform cursor-pointer">
                      <img 
                        src={url} 
                        alt={`תמונה מקורית ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Processed Images Column */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">תמונות מעובדות</h3>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                  {submission.processed_image_urls?.map((url, index) => (
                    <div 
                      key={index} 
                      className={`aspect-square bg-white rounded-lg border-2 overflow-hidden hover:scale-105 transition-transform cursor-pointer ${
                        url === submission.main_processed_image_url 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={`תמונה מעובדת ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {url === submission.main_processed_image_url && (
                        <Badge className="absolute top-2 right-2 bg-blue-500">
                          ראשית
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {/* Upload Area */}
                  {viewMode === 'admin' && (
                    <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 cursor-pointer transition-colors">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">העלה תמונה</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid - Responsive Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                פרטי ההגשה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-gray-500">סוג פריט</Label>
                <p className="text-sm font-medium">{submission.item_type}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">תאריך הגשה</Label>
                <p className="text-sm font-medium">
                  {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">עדיפות</Label>
                <p className="text-sm font-medium">{submission.priority || 'רגילה'}</p>
              </div>
              <div>
                <Label className="text-xs text-gray-500">עורך מוקצה</Label>
                <p className="text-sm font-medium">{submission.assigned_editor_id || 'לא הוקצה'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Client/Lead Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                פרטי {submission.clients ? 'לקוח' : 'ליד'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.clients && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">שם מסעדה</Label>
                    <p className="text-sm font-medium">{submission.clients.restaurant_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">איש קשר</Label>
                    <p className="text-sm font-medium">{submission.clients.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.clients.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.clients.phone}</p>
                  </div>
                </>
              )}
              {submission.leads && (
                <>
                  <div>
                    <Label className="text-xs text-gray-500">שם מסעדה</Label>
                    <p className="text-sm font-medium">{submission.leads.restaurant_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">איש קשר</Label>
                    <p className="text-sm font-medium">{submission.leads.contact_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.leads.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.leads.phone}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Original Submission Contact Info (if available) */}
          {(submission.submission_contact_name || submission.submission_contact_email || submission.submission_contact_phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  פרטי יצירת קשר מהטופס
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.submission_contact_name && (
                  <div>
                    <Label className="text-xs text-gray-500">שם איש קשר</Label>
                    <p className="text-sm font-medium">{submission.submission_contact_name}</p>
                  </div>
                )}
                {submission.submission_contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.submission_contact_email}</p>
                  </div>
                )}
                {submission.submission_contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{submission.submission_contact_phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI & LoRA Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                הגדרות AI & LoRA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div>
                  <Label htmlFor="lora-link" className="text-xs text-gray-500">קישור LoRA</Label>
                  <Input
                    id="lora-link"
                    value={loraData.lora_link}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, lora_link: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="הזן קישור LoRA"
                    className="mt-1"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
                <div>
                  <Label htmlFor="lora-name" className="text-xs text-gray-500">שם LoRA</Label>
                  <Input
                    id="lora-name"
                    value={loraData.lora_name}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, lora_name: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="שם תיאורי של LoRA"
                    className="mt-1"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
                <div>
                  <Label htmlFor="fixed-prompt" className="text-xs text-gray-500">Prompt קבוע</Label>
                  <Textarea
                    id="fixed-prompt"
                    value={loraData.fixed_prompt}
                    onChange={(e) => {
                      setLoraData(prev => ({ ...prev, fixed_prompt: e.target.value }));
                      setEditingLoraFields(true);
                    }}
                    placeholder="כתוב את ה-prompt המותאם אישית..."
                    className="mt-1 font-mono text-sm min-h-[100px]"
                    disabled={viewMode !== 'admin'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comments System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              מערכת הערות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeCommentTab} onValueChange={(value) => setActiveCommentTab(value as SubmissionCommentType)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="admin_internal" className="flex items-center gap-2">
                  הערות פנימיות
                  <Badge variant="destructive" className="text-xs">
                    {getCommentsByType('admin_internal').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="client_visible" className="flex items-center gap-2">
                  הערות ללקוח
                  <Badge variant="default" className="text-xs bg-green-500">
                    {getCommentsByType('client_visible').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="editor_note" className="flex items-center gap-2">
                  הערות לעורך
                  <Badge variant="default" className="text-xs bg-blue-500">
                    {getCommentsByType('editor_note').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              {/* Comment Input */}
              {viewMode === 'admin' && (
                <div className="mt-4 space-y-2">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`כתוב הערה ${activeCommentTab === 'admin_internal' ? 'פנימית' : 
                      activeCommentTab === 'client_visible' ? 'ללקוח' : 'לעורך'}...`}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="w-full"
                  >
                    <MessageSquare className="h-4 w-4 ml-2" />
                    שלח הערה
                  </Button>
                </div>
              )}

              {/* Comments List */}
              <TabsContent value={activeCommentTab} className="mt-4">
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getCommentsByType(activeCommentTab).map((comment) => (
                    <div key={comment.comment_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">
                          {comment.created_by_user?.email || 'משתמש לא ידוע'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(comment.created_at).toLocaleString('he-IL')}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.comment_text}</p>
                    </div>
                  ))}
                  {getCommentsByType(activeCommentTab).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>אין הערות עדיין</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              היסטוריית סטטוס
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{statusInfo.label}</span>
                    <span className="text-sm text-gray-500">עכשיו</span>
                  </div>
                  <p className="text-sm text-gray-600">סטטוס נוכחי</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">הגשה התקבלה</span>
                    <span className="text-sm text-gray-500">
                      {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ההגשה נוצרה במערכת</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 