import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Building2, 
  Mail, 
  Phone,
  FileImage,
  Calendar,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PublicSubmission {
  id: string;
  restaurant_name: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  item_type: 'dish' | 'cocktail' | 'drink';
  item_name: string;
  description?: string;
  special_notes?: string;
  original_image_urls: string[];
  branding_material_urls: string[];
  reference_example_urls: string[];
  status: 'pending' | 'approved' | 'rejected' | 'processed';
  processed_at?: string;
  processed_by?: string;
  submission_data?: any;
  created_at: string;
  updated_at: string;
}

const PublicSubmissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [itemTypeFilter, setItemTypeFilter] = useState('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch public submissions
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['public-submissions'],
    queryFn: async () => {
      console.log('[PublicSubmissions] Fetching public submissions...');
      
      const { data, error } = await (supabase as any)
        .from('public_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[PublicSubmissions] Error fetching submissions:', error);
        throw error;
      }
      
      console.log('[PublicSubmissions] Fetched submissions:', data?.length);
      return data as PublicSubmission[];
    }
  });

  // Process submission mutation (approve and move to main tables)
  const processSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, action }: { submissionId: string; action: 'approve' | 'reject' }) => {
             if (action === 'approve') {
         // Call the database function to process the submission
         const { data, error } = await (supabase as any)
           .rpc('process_public_submission', {
             submission_id: submissionId
           });

         if (error) throw error;
         return data;
       } else {
         // Just update status to rejected
         const { error } = await (supabase as any)
           .from('public_submissions')
           .update({ 
             status: 'rejected',
             processed_at: new Date().toISOString()
           })
           .eq('id', submissionId);

         if (error) throw error;
         return { success: true };
       }
    },
    onSuccess: (data, variables) => {
      const action = variables.action === 'approve' ? 'אושרה' : 'נדחתה';
      toast.success(`ההגשה ${action} בהצלחה`);
      queryClient.invalidateQueries({ queryKey: ['public-submissions'] });
      setIsViewerOpen(false);
    },
    onError: (error) => {
      console.error('Error processing submission:', error);
      toast.error('שגיאה בעיבוד ההגשה');
    }
  });

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = !searchTerm || 
      submission.restaurant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    const matchesItemType = itemTypeFilter === 'all' || submission.item_type === itemTypeFilter;
    
    return matchesSearch && matchesStatus && matchesItemType;
  });

  const handleViewSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedSubmissionId(null);
  };

  const selectedSubmission = selectedSubmissionId 
    ? submissions.find(s => s.id === selectedSubmissionId)
    : null;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'ממתינה לאישור', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'אושרה', variant: 'default' as const, icon: Check },
      rejected: { label: 'נדחתה', variant: 'destructive' as const, icon: X },
      processed: { label: 'עובדה', variant: 'outline' as const, icon: Check }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getItemTypeLabel = (itemType: string) => {
    const labels = {
      dish: 'מנה',
      cocktail: 'קוקטייל', 
      drink: 'משקה'
    };
    return labels[itemType as keyof typeof labels] || itemType;
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              שגיאה בטעינת ההגשות: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">הגשות אנונימיות</h1>
        <p className="text-muted-foreground">
          הגשות שהועלו דרך הטופס הציבורי ומחכות לאישור
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">חיפוש</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="שם מסעדה, פריט או איש קשר..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>סטטוס</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסטטוסים</SelectItem>
                  <SelectItem value="pending">ממתינה לאישור</SelectItem>
                  <SelectItem value="approved">אושרה</SelectItem>
                  <SelectItem value="rejected">נדחתה</SelectItem>
                  <SelectItem value="processed">עובדה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>סוג פריט</Label>
              <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הסוגים</SelectItem>
                  <SelectItem value="dish">מנה</SelectItem>
                  <SelectItem value="cocktail">קוקטייל</SelectItem>
                  <SelectItem value="drink">משקה</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-muted-foreground">
                סה"כ: {filteredSubmissions.length} הגשות
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Grid */}
      {isLoading ? (
        <div className="text-center py-12">טוען הגשות...</div>
      ) : filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {submissions.length === 0 ? 'אין הגשות אנונימיות' : 'אין הגשות התואמות לחיפוש'}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{submission.item_name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Building2 className="w-4 h-4" />
                      {submission.restaurant_name}
                    </div>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    {getItemTypeLabel(submission.item_type)}
                  </Badge>
                  {submission.original_image_urls.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <FileImage className="w-3 h-3" />
                      {submission.original_image_urls.length} תמונות
                    </Badge>
                  )}
                </div>

                {submission.contact_name && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {submission.contact_name}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(submission.created_at).toLocaleDateString('he-IL')}
                </div>

                <div className="pt-2">
                  <Button 
                    onClick={() => handleViewSubmission(submission.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    הצג פרטים
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Submission Viewer Sheet */}
      <Sheet open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <SheetContent className="max-w-4xl w-full overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle>פרטי הגשה אנונימית</SheetTitle>
            <SheetDescription>
              סקירה ואישור הגשה שהועלתה דרך הטופס הציבורי
            </SheetDescription>
          </SheetHeader>

          {selectedSubmission && (
            <div className="mt-6 space-y-6">
              {/* Status and Actions */}
              <div className="flex justify-between items-center">
                {getStatusBadge(selectedSubmission.status)}
                {selectedSubmission.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => processSubmissionMutation.mutate({ 
                        submissionId: selectedSubmission.id, 
                        action: 'approve' 
                      })}
                      disabled={processSubmissionMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      אשר והעבר למערכת
                    </Button>
                    <Button
                      onClick={() => processSubmissionMutation.mutate({ 
                        submissionId: selectedSubmission.id, 
                        action: 'reject' 
                      })}
                      disabled={processSubmissionMutation.isPending}
                      variant="destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      דחה
                    </Button>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>פרטים בסיסיים</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>שם הפריט</Label>
                      <div className="font-medium">{selectedSubmission.item_name}</div>
                    </div>
                    <div>
                      <Label>סוג פריט</Label>
                      <div className="font-medium">{getItemTypeLabel(selectedSubmission.item_type)}</div>
                    </div>
                    <div>
                      <Label>שם המסעדה</Label>
                      <div className="font-medium">{selectedSubmission.restaurant_name}</div>
                    </div>
                    <div>
                      <Label>איש קשר</Label>
                      <div className="font-medium">{selectedSubmission.contact_name || 'לא צוין'}</div>
                    </div>
                  </div>

                  {selectedSubmission.description && (
                    <div>
                      <Label>תיאור</Label>
                      <div className="font-medium">{selectedSubmission.description}</div>
                    </div>
                  )}

                  {selectedSubmission.special_notes && (
                    <div>
                      <Label>הערות מיוחדות</Label>
                      <div className="font-medium">{selectedSubmission.special_notes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Info */}
              {(selectedSubmission.contact_email || selectedSubmission.contact_phone) && (
                <Card>
                  <CardHeader>
                    <CardTitle>פרטי קשר</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedSubmission.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{selectedSubmission.contact_email}</span>
                      </div>
                    )}
                    {selectedSubmission.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{selectedSubmission.contact_phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Images */}
              {selectedSubmission.original_image_urls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>תמונות מקור ({selectedSubmission.original_image_urls.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedSubmission.original_image_urls.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`תמונה ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Branding Materials */}
              {selectedSubmission.branding_material_urls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>חומרי מיתוג ({selectedSubmission.branding_material_urls.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedSubmission.branding_material_urls.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`חומר מיתוג ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Reference Examples */}
              {selectedSubmission.reference_example_urls.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>תמונות השראה ({selectedSubmission.reference_example_urls.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedSubmission.reference_example_urls.map((url, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={url}
                            alt={`תמונת השראה ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom Style Instructions */}
              {selectedSubmission.submission_data?.customStyle?.instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle>הוראות עיצוב מותאמות</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
                      {selectedSubmission.submission_data.customStyle.instructions}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>מידע נוסף</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div>תאריך הגשה: {new Date(selectedSubmission.created_at).toLocaleString('he-IL')}</div>
                  <div>מזהה הגשה: {selectedSubmission.id}</div>
                  {selectedSubmission.processed_at && (
                    <div>תאריך עיבוד: {new Date(selectedSubmission.processed_at).toLocaleString('he-IL')}</div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default PublicSubmissionsPage; 