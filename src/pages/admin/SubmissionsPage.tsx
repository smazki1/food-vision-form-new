import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Submission } from '@/api/submissionApi';
import { Link } from 'react-router-dom';

const SubmissionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['submissions'],
    queryFn: async () => {
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
          target_completion_date,
          priority,
          created_lead_id,
          submission_contact_name,
          submission_contact_email,
          submission_contact_phone,
          lead_id,
          created_at
        `)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data as Submission[];
    }
  });

  const filteredSubmissions = submissions.filter(submission =>
    submission.item_name_at_submission.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ממתינה לעיבוד': return 'bg-yellow-100 text-yellow-800';
      case 'בעיבוד': return 'bg-blue-100 text-blue-800';
      case 'מוכנה להצגה': return 'bg-purple-100 text-purple-800';
      case 'הערות התקבלו': return 'bg-orange-100 text-orange-800';
      case 'הושלמה ואושרה': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">טוען הגשות...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">ניהול הגשות</h1>
        <Input
          placeholder="חיפוש לפי שם מנה..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.submission_id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{submission.item_name_at_submission}</CardTitle>
                  <p className="text-sm text-gray-600">{submission.item_type}</p>
                </div>
                <Badge className={getStatusColor(submission.submission_status)}>
                  {submission.submission_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <p>תמונות מקוריות: {submission.original_image_urls?.length || 0}</p>
                  <p>תמונות מעובדות: {submission.processed_image_urls?.length || 0}</p>
                  <p>הועלה ב: {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}</p>
                </div>
                <Button asChild>
                  <Link to={`/admin/submissions/${submission.submission_id}`}>
                    צפה בפרטים
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SubmissionsPage;
