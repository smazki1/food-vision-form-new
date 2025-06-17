
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSubmission } from '@/types/submission';
import { Button } from '@/components/ui/button';
import { ArrowRight, Download, Heart, MessageCircle, RefreshCcw, Star, ThumbsUp, Eye, Calendar, MapPin } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { getStatusIconAndStyle, getItemTypeName as getSubmissionItemTypeName } from './CustomerSubmissionsStatusPage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

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

const ImageGallery = ({ images, title }: { images: string[]; title: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (!images?.length) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">אין תמונות זמינות</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      
      {/* Main Image */}
      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <img 
          src={images[currentIndex]} 
          alt={`${title} ${currentIndex + 1}`}
          className="w-full aspect-square object-cover"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                index === currentIndex ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ComparisonView = ({ originalUrl, processedUrl }: { originalUrl: string; processedUrl: string }) => {
  const [showProcessed, setShowProcessed] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => setShowProcessed(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showProcessed ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
            }`}
          >
            מקור
          </button>
          <button
            onClick={() => setShowProcessed(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showProcessed ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
            }`}
          >
            משופר
          </button>
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden shadow-lg">
        <img 
          src={showProcessed ? processedUrl : originalUrl}
          alt={showProcessed ? 'תמונה משופרת' : 'תמונה מקורית'}
          className="w-full aspect-square object-cover transition-opacity duration-300"
        />
        <div className="absolute top-4 left-4">
          <Badge variant={showProcessed ? "default" : "secondary"}>
            {showProcessed ? 'משופר' : 'מקור'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const SubmissionDetailsPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<CustomerSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("comparison");
  const [feedback, setFeedback] = useState("");

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרטי הגשה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link to="/submissions-status">חזור לרשימת ההגשות</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-gray-400 text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ההגשה לא נמצאה</h2>
          <p className="text-gray-600 mb-4">לא הצלחנו למצוא את ההגשה שחיפשת</p>
          <Button asChild variant="outline">
            <Link to="/submissions-status">חזור לרשימת ההגשות</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusIconAndStyle(submission.submission_status);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <Button asChild variant="ghost" size="sm" className="p-2">
              <Link to="/submissions-status">
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            
            <Badge className={`${statusInfo.style} text-sm`}>
              {React.cloneElement(statusInfo.icon, { className: "w-4 h-4 ml-1" })}
              {statusInfo.hebrew}
            </Badge>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-gray-900 mb-1">
              {submission.item_name_at_submission}
            </h1>
            <div className="flex items-center text-sm text-gray-500 gap-4">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {submission.restaurant_name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(submission.uploaded_at).toLocaleDateString('he-IL')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Image Tabs */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-gray-100">
                <TabsList className="w-full h-auto p-0 bg-transparent rounded-none">
                  <TabsTrigger 
                    value="comparison" 
                    className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent"
                  >
                    השוואה
                  </TabsTrigger>
                  <TabsTrigger 
                    value="original"
                    className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent"
                  >
                    תמונות מקור
                  </TabsTrigger>
                  <TabsTrigger 
                    value="processed"
                    className="flex-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-700 rounded-none border-b-2 border-transparent"
                  >
                    תמונות משופרות
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="comparison" className="mt-0">
                  <ComparisonView 
                    originalUrl={submission.original_image_urls?.[0] || ''} 
                    processedUrl={submission.processed_image_urls?.[0] || ''}
                  />
                </TabsContent>
                
                <TabsContent value="original" className="mt-0">
                  <ImageGallery 
                    images={submission.original_image_urls || []} 
                    title="תמונות מקור"
                  />
                </TabsContent>
                
                <TabsContent value="processed" className="mt-0">
                  <ImageGallery 
                    images={submission.processed_image_urls || []} 
                    title="תמונות משופרות"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">משוב והערות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="שתפו אותנו במחשבות שלכם על התוצאה..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="resize-none"
            />
            
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" size="sm" className="text-pink-600 hover:text-pink-700 hover:bg-pink-50">
                <Heart className="w-4 h-4 ml-2" />
                אהבתי
              </Button>
              <Button variant="ghost" size="sm" className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50">
                <Star className="w-4 h-4 ml-2" />
                דירוג
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
            <ThumbsUp className="w-4 h-4 ml-2" />
            אשר תוצאה
          </Button>
          
          <Button variant="outline" className="w-full border-orange-300 text-orange-600 hover:bg-orange-50">
            <RefreshCcw className="w-4 h-4 ml-2" />
            בקש שינויים
          </Button>
          
          <Button variant="outline" className="w-full">
            <MessageCircle className="w-4 h-4 ml-2" />
            שלח הודעה
          </Button>
          
          <Button variant="outline" className="w-full">
            <Download className="w-4 h-4 ml-2" />
            הורד תמונות
          </Button>
        </div>

        {/* Bottom Spacing for Mobile */}
        <div className="h-8"></div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
