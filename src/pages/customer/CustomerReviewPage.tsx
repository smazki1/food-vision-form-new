import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Client {
  client_id: string;
  restaurant_name: string;
}

interface Submission {
  submission_id: string;
  item_name_at_submission: string;
  submission_status: string;
  original_image_urls: string[] | null;
  processed_image_urls: string[] | null;
  main_processed_image_url: string | null;
}

const CustomerReviewPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleViewSubmission = (submissionId: string) => {
    navigate(`/customer-review/${clientId}/submission/${submissionId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!clientId) return;
      
      try {
        // Fetch client data
        const { data: clientData } = await supabase
          .from('clients')
          .select('client_id, restaurant_name')
          .eq('client_id', clientId)
          .single();
        
        if (clientData) {
          setClient(clientData);
        }

        // Fetch submissions data
        const { data: submissionsData } = await supabase
          .from('customer_submissions')
          .select(`
            submission_id,
            item_name_at_submission,
            submission_status,
            original_image_urls,
            processed_image_urls,
            main_processed_image_url
          `)
          .eq('client_id', clientId);

        if (submissionsData) {
          setSubmissions(submissionsData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your food gallery...</p>
        </div>
      </div>
    );
  }

  if (!client && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Restaurant Not Found</h1>
          <p className="text-gray-600">The requested restaurant gallery could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <main className="container mx-auto py-8 px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            {client?.restaurant_name || 'Food Gallery'}
          </h1>
          <p className="text-lg text-gray-600 mt-2">תוצאות הצילום המקצועי שלכם</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {submissions.map((submission) => (
            <Card key={submission.submission_id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                {submission.main_processed_image_url ? (
                  <img 
                    src={submission.main_processed_image_url} 
                    alt={submission.item_name_at_submission}
                    className="w-full h-64 object-cover"
                  />
                ) : submission.original_image_urls?.[0] ? (
                  <img 
                    src={submission.original_image_urls[0]} 
                    alt={submission.item_name_at_submission}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">תמונה לא זמינה</span>
                  </div>
                )}
                
                {/* Hover overlay with view button */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    onClick={() => handleViewSubmission(submission.submission_id)}
                    className="bg-white text-black hover:bg-gray-100"
                  >
                    <Eye className="ml-2 h-4 w-4" />
                    צפייה בפרטים
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-2 truncate">
                  {submission.item_name_at_submission}
                </h3>
                
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant="outline" 
                    className={
                      submission.submission_status === 'הושלמה ואושרה' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : submission.submission_status === 'בעיבוד'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {submission.submission_status}
                  </Badge>
                  
                  <span className="text-sm text-gray-500">
                    {submission.processed_image_urls?.length || 0} וריאציות
                  </span>
                </div>
                
                {/* Click to view button */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewSubmission(submission.submission_id)}
                >
                  <Eye className="ml-2 h-4 w-4" />
                  צפייה בהגשה
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {submissions.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">עדיין אין הגשות</h3>
            <p className="text-gray-500">התמונות המעובדות שלכם יופיעו כאן בקרוב</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerReviewPage; 