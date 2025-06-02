import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download, ArrowLeft, Edit, Save, X, ImageIcon, Phone, Mail, User, Building2 } from "lucide-react";

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Fetch submission details
  const { data: submission, isLoading } = useQuery({
    queryKey: ["submission-details", submissionId],
    queryFn: async () => {
      if (!submissionId) throw new Error("No submission ID");
      
      const { data, error } = await supabase
        .from("customer_submissions")
        .select(`
          *,
          clients(restaurant_name, contact_name, email, phone),
          leads(restaurant_name, contact_name, email, phone)
        `)
        .eq("submission_id", submissionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!submissionId
  });

  // Update submission mutation
  const updateSubmission = useMutation({
    mutationFn: async (updates: any) => {
      const { data, error } = await supabase
        .from("customer_submissions")
        .update(updates)
        .eq("submission_id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("ההגשה עודכנה בהצלחה");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["submission-details", submissionId] });
      queryClient.invalidateQueries({ queryKey: ["all-submissions"] });
    },
    onError: (error: any) => {
      toast.error(`שגיאה בעדכון ההגשה: ${error.message}`);
    }
  });

  // Download image function
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("התמונה הורדה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בהורדת התמונה");
    }
  };

  // Download all images
  const downloadAllImages = async () => {
    if (!submission?.original_image_urls?.length) {
      toast.error("אין תמונות להורדה");
      return;
    }

    for (let i = 0; i < submission.original_image_urls.length; i++) {
      const url = submission.original_image_urls[i];
      const filename = `${submission.item_name_at_submission}_${i + 1}.jpg`;
      await downloadImage(url, filename);
      // Add delay between downloads to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleSave = () => {
    updateSubmission.mutate(editData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8" dir="rtl">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container max-w-7xl mx-auto py-8" dir="rtl">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">הגשה לא נמצאה</h2>
            <Button onClick={() => navigate("/admin/submissions")}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              חזרה להגשות
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusOptions = [
    "ממתינה לעיבוד",
    "בעיבוד", 
    "מוכנה להצגה",
    "הערות התקבלו",
    "הושלמה ואושרה"
  ];

  const priorityOptions = ["Low", "Medium", "High", "Urgent"];

  return (
    <div className="container max-w-7xl mx-auto py-8" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button variant="outline" onClick={() => navigate("/admin/submissions")}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            חזרה להגשות
          </Button>
          <h1 className="text-2xl font-bold">פרטי הגשה</h1>
        </div>
        
        <div className="flex space-x-2 space-x-reverse">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="ml-2 h-4 w-4" />
              ערוך
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={updateSubmission.isPending}>
                <Save className="ml-2 h-4 w-4" />
                שמור
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="ml-2 h-4 w-4" />
                ביטול
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main submission details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>מידע בסיסי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>שם הפריט</Label>
                  {isEditing ? (
                    <Input 
                      value={editData.item_name_at_submission || submission.item_name_at_submission} 
                      onChange={(e) => setEditData({...editData, item_name_at_submission: e.target.value})}
                    />
                  ) : (
                    <p className="text-lg font-semibold">{submission.item_name_at_submission}</p>
                  )}
                </div>
                <div>
                  <Label>סוג הפריט</Label>
                  <p className="text-lg">{submission.item_type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>סטטוס</Label>
                  {isEditing ? (
                    <Select 
                      value={editData.submission_status || submission.submission_status}
                      onValueChange={(value) => setEditData({...editData, submission_status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{submission.submission_status}</Badge>
                  )}
                </div>
                <div>
                  <Label>עדיפות</Label>
                  {isEditing ? (
                    <Select 
                      value={editData.priority || submission.priority || "Medium"}
                      onValueChange={(value) => setEditData({...editData, priority: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={submission.priority === "High" ? "destructive" : "secondary"}>
                      {submission.priority || "Medium"}
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label>הערות פנימיות</Label>
                {isEditing ? (
                  <Textarea 
                    value={editData.internal_team_notes || submission.internal_team_notes || ""} 
                    onChange={(e) => setEditData({...editData, internal_team_notes: e.target.value})}
                    placeholder="הוסף הערות פנימיות..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600 mt-1">
                    {submission.internal_team_notes || "אין הערות פנימיות"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>תמונות מקוריות</CardTitle>
              <Button onClick={downloadAllImages} variant="outline" size="sm">
                <Download className="ml-2 h-4 w-4" />
                הורד הכל
              </Button>
            </CardHeader>
            <CardContent>
              {submission.original_image_urls && submission.original_image_urls.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {submission.original_image_urls.map((url: string, index: number) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`תמונה ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => downloadImage(url, `${submission.item_name_at_submission}_${index + 1}.jpg`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">אין תמונות</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Restaurant/Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>פרטי המסעדה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {submission.clients ? (
                <>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{submission.clients.restaurant_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{submission.clients.contact_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{submission.clients.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{submission.clients.phone}</span>
                  </div>
                </>
              ) : submission.leads ? (
                <>
                  <Badge variant="outline">נוצר ליד</Badge>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{submission.leads.restaurant_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{submission.leads.contact_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span>{submission.leads.email}</span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{submission.leads.phone}</span>
                  </div>
                </>
              ) : (
                <>
                  <Badge variant="destructive">לא מקושר</Badge>
                  {submission.submission_contact_name && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{submission.submission_contact_name}</span>
                    </div>
                  )}
                  {submission.submission_contact_email && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{submission.submission_contact_email}</span>
                    </div>
                  )}
                  {submission.submission_contact_phone && (
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{submission.submission_contact_phone}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>ציר זמן</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">הועלה:</div>
                <div className="text-gray-600">
                  {new Date(submission.uploaded_at).toLocaleDateString('he-IL')} 
                  {' '}
                  {new Date(submission.uploaded_at).toLocaleTimeString('he-IL')}
                </div>
              </div>
              {submission.created_at !== submission.uploaded_at && (
                <div className="text-sm">
                  <div className="font-medium">נוצר:</div>
                  <div className="text-gray-600">
                    {new Date(submission.created_at).toLocaleDateString('he-IL')}
                    {' '}
                    {new Date(submission.created_at).toLocaleTimeString('he-IL')}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
