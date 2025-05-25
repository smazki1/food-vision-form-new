import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Submission as CustomerSubmission } from '@/api/submissionApi';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getStatusIconAndStyle, getItemTypeName as getSubmissionItemTypeName } from './CustomerSubmissionsStatusPage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface OriginalItemSpecificDetails {
  name?: string; 
  description?: string | null;
  notes?: string | null;
  reference_image_urls?: string[] | null;
}

interface FullSubmissionDetails extends CustomerSubmission {
  originalItemDetails?: OriginalItemSpecificDetails;
}

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<FullSubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      if (!submissionId) {
        setError('מזהה הגשה לא תקין.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: subData, error: subError } = await supabase
          .from('customer_submissions')
          .select('*')
          .eq('submission_id', submissionId)
          .single();

        if (subError || !subData) {
          throw new Error(subError?.message || 'ההגשה לא נמצאה.');
        }
        
        const typedSubData = subData as CustomerSubmission;

        let fullDetails: FullSubmissionDetails = { ...typedSubData };

        if (typedSubData.original_item_id && typedSubData.item_type) {
          const itemTable = `${typedSubData.item_type}s`;
          const itemIdColumn = `${typedSubData.item_type}_id`;

          const { data: itemData, error: itemError } = await supabase
            .from(itemTable as any) 
            .select('name, description, notes, reference_image_urls')
            .eq(itemIdColumn, typedSubData.original_item_id)
            .single<OriginalItemSpecificDetails>(); 

          if (itemError) {
            console.warn(`Could not fetch original item details for ${typedSubData.item_type} ${typedSubData.original_item_id}: ${itemError.message}`);
          } else if (itemData) {
            fullDetails.originalItemDetails = itemData;
          }
        }
        setSubmission(fullDetails);
      } catch (err: any) {
        console.error("Error fetching submission details:", err);
        setError(err.message || 'שגיאה בטעינת פרטי ההגשה.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId]);

  if (loading) {
    return <div dir="rtl" className="text-center p-10">טוען פרטי הגשה...</div>;
  }

  if (error) {
    return <div dir="rtl" className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!submission) {
    return <div dir="rtl" className="text-center p-10">ההגשה לא נמצאה.</div>;
  }

  const statusInfo = getStatusIconAndStyle(submission.submission_status);
  const itemDetails = submission.originalItemDetails;

  return (
    <div dir="rtl" className="p-4 md:p-8 max-w-4xl mx-auto">
      <Button asChild variant="outline" className="mb-6">
        <Link to="/customer/submissions-status">
          <ArrowRight className="ml-2 h-4 w-4" />
          חזור לרשימת ההגשות
        </Link>
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-2xl mb-1">{submission.item_name_at_submission}</CardTitle>
                <CardDescription>{getSubmissionItemTypeName(submission.item_type)}</CardDescription>
            </div>
            <Badge variant="outline" className={`border-transparent ${statusInfo.style}`}>
                {statusInfo.icon}
                <span className="ml-2">{statusInfo.hebrewStatus}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-semibold text-gray-700 mb-1">תאריך הגשה:</h3>
                <p className="text-sm text-gray-600">{new Date(submission.uploaded_at).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
            {itemDetails?.description && (
                <div>
                    <h3 className="font-semibold text-gray-700 mb-1">תיאור מההגשה המקורית:</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{itemDetails.description}</p>
                </div>
            )}
            {itemDetails?.notes && (
                <div>
                    <h3 className="font-semibold text-gray-700 mb-1">הערות מיוחדות מההגשה המקורית:</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{itemDetails.notes}</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      {itemDetails?.reference_image_urls && itemDetails.reference_image_urls.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle>תמונות מקור (שהעלית)</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {itemDetails.reference_image_urls.map((url, index) => (
              <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                <img src={url} alt={`תמונת מקור ${index + 1}`} className="rounded-md object-cover w-full h-40 shadow aspect-square transition-transform group-hover:scale-105" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      {(submission.processed_image_urls && submission.processed_image_urls.length > 0) || submission.main_processed_image_url ? (
        <Card>
          <CardHeader><CardTitle>תמונות מעובדות</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {submission.main_processed_image_url && (
                <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-700 mb-2">תמונה ראשית מעובדת:</h3>
                     <a href={submission.main_processed_image_url} target="_blank" rel="noopener noreferrer" className="block group">
                        <img src={submission.main_processed_image_url} alt="תמונה ראשית מעובדת" className="rounded-lg object-contain w-full max-h-96 shadow-md transition-transform group-hover:scale-105" />
                    </a>
                </div>
            )}
            {submission.processed_image_urls && submission.processed_image_urls.length > 0 && (
                 <div>
                    <h3 className="font-semibold text-lg text-gray-700 mb-2">כל התמונות המעובדות:</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {submission.processed_image_urls.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block group">
                            <img src={url} alt={`תמונה מעובדת ${index + 1}`} className="rounded-md object-cover w-full h-40 shadow aspect-square transition-transform group-hover:scale-105" />
                        </a>
                    ))}
                    </div>
                </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
            <CardHeader><CardTitle>תמונות מעובדות</CardTitle></CardHeader>
            <CardContent>
                <p className="text-sm text-gray-500">התמונות עדיין לא עברו עיבוד או שאין תמונות מעובדות עבור הגשה זו.</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
};

export default SubmissionDetailsPage;
