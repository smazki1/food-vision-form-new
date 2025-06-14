import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSubmission } from '@/types/submission';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Heart, MessageCircle, RefreshCcw, Star, ThumbsUp } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getStatusIconAndStyle, getItemTypeName as getSubmissionItemTypeName } from './CustomerSubmissionsStatusPage';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OriginalImagesCustomerTab from '@/components/customer/OriginalImagesCustomerTab';
import { Textarea } from '@/components/ui/textarea';

const ImageComparison = ({ originalUrl, processedUrl }: { originalUrl: string; processedUrl: string }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <h3 className="font-semibold mb-2 text-center">מקור</h3>
            <img src={originalUrl} alt="Original" className="rounded-lg w-full object-cover aspect-square" />
        </div>
        <div>
            <h3 className="font-semibold mb-2 text-center">משופר</h3>
            <img src={processedUrl} alt="Processed" className="rounded-lg w-full object-cover aspect-square" />
        </div>
    </div>
);

const mockDetailedSubmission: CustomerSubmission = {
  submission_id: '1',
  client_id: 'mock-client-id-xyz',
  uploaded_at: new Date().toISOString(),
  processed_at: null,
  final_approval_timestamp: null,
  assigned_editor_id: null,
  edit_history: null,
  lead_id: null,
  original_item_id: null,
  created_lead_id: null,
  processed_image_count: 1,
  image_credits_used: 1,
  main_processed_image_url: null,
  lora_link: null,
  lora_name: null,
  lora_id: null,
  fixed_prompt: null,
  restaurant_name: 'בורגר בר',
  contact_name: 'ישראל ישראלי',
  email: 'israel@example.com',
  phone: '050-1234567',
  branding_material_urls: [],
  reference_example_urls: [],
  description: 'המבורגר עוף פיקנטי בלחמניית בריוש עם ירקות טריים ורוטב סודי.',
  category: 'מנה עיקרית',
  ingredients: ['לחמניית בריוש', 'קציצת עוף', 'חסה', 'עגבניה', 'בצל סגול', 'רוטב סודי'],
  item_type: 'dish',
  item_name_at_submission: 'ספייסי צ\'יקן בורגר',
  submission_status: 'מוכן לבדיקה',
  original_image_urls: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2072&auto=format&fit=crop'],
  processed_image_urls: ['https://images.unsplash.com/photo-1607013251379-e6eecfffe234?q=80&w=1974&auto=format&fit=crop'],
};

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<CustomerSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("variation-1");

  useEffect(() => {
    if (submissionId === '1') {
      setSubmission(mockDetailedSubmission);
      setLoading(false);
      return;
    }
      
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
        
        setSubmission(subData as CustomerSubmission);
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

  return (
    <div dir="rtl" className="bg-slate-50 min-h-screen p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="icon">
                <Link to="/submissions-status">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            <h1 className="text-2xl font-bold">{submission.item_name_at_submission}</h1>
          </div>
          <Badge variant="outline" className={`border-transparent text-sm py-1 px-3 ${statusInfo.style}`}>
              {React.cloneElement(statusInfo.icon, { className: "w-4 h-4 ml-2" })}
              {statusInfo.hebrew}
          </Badge>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-grid md:grid-cols-[auto,auto,auto] gap-2">
            <TabsTrigger value="original">תמונות מקור</TabsTrigger>
            <TabsTrigger value="variation-1">וריאציה 1</TabsTrigger>
            {/* Add more variation tabs as needed */}
          </TabsList>
          
          <Card className="mt-4">
            <CardContent className="p-6">
              <TabsContent value="original">
                <OriginalImagesCustomerTab submission={submission} onImageClick={(url) => console.log(url)} />
              </TabsContent>
              <TabsContent value="variation-1">
                <div className="space-y-6">
                    <div className="flex justify-center">
                        <Badge>Side-by-Side</Badge>
                    </div>
                    <ImageComparison 
                        originalUrl={submission.original_image_urls?.[0] || 'https://via.placeholder.com/400'} 
                        processedUrl={submission.processed_image_urls?.[0] || 'https://via.placeholder.com/400'}
                    />
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
        
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>בדיקה ומשוב</CardTitle>
            </CardHeader>
            <CardContent>
                <Textarea placeholder="כתבו את המשוב שלכם כאן..." rows={5} />
                <div className="flex items-center gap-6 mt-4">
                    <Button variant="ghost" className="text-muted-foreground"><Heart className="ml-2"/> לייק</Button>
                    <Button variant="ghost" className="text-muted-foreground"><Star className="ml-2"/> דרג</Button>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost">הקודם</Button>
                <Button>הבא</Button>
            </CardFooter>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Button variant="outline" size="lg" className="bg-white"><MessageCircle className="ml-2" />הוסף תגובה</Button>
            <Button variant="outline" size="lg" className="bg-white text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"><ThumbsUp className="ml-2" />אשר גרסה</Button>
            <Button variant="outline" size="lg" className="bg-white text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"><RefreshCcw className="ml-2" />בקש תיקון</Button>
            <Button variant="outline" size="lg" className="bg-white"><Download className="ml-2" />הורד תמונות</Button>
        </div>

      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
