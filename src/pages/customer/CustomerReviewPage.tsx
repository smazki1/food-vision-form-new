
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CustomerSubmission } from '@/types/submission';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, ThumbsUp, ThumbsDown, MessageCircle, Download, Share2, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const CustomerReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<CustomerSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) {
        setError('מזהה הגשה לא תקין');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('customer_submissions')
          .select('*')
          .eq('submission_id', id)
          .single();

        if (error || !data) {
          throw new Error('ההגשה לא נמצאה');
        }

        setSubmission(data as CustomerSubmission);
      } catch (err: any) {
        console.error('Error fetching submission:', err);
        setError(err.message || 'שגיאה בטעינת ההגשה');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleSubmitReview = async () => {
    if (!submission || rating === 0) {
      toast.error('אנא בחרו דירוג לפני השליחה');
      return;
    }

    setSubmitting(true);
    try {
      toast.success('המשוב נשלח בהצלחה!');
    } catch (err) {
      toast.error('שגיאה בשליחת המשוב');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">שגיאה</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const processedImage = submission.processed_image_urls?.[0] || submission.main_processed_image_url;
  const originalImage = submission.original_image_urls?.[0];

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 pb-safe">
      {/* Header - Fixed but not overlapping content */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-top">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="sm" className="p-2 min-w-0">
              <ArrowRight className="h-5 w-5" />
            </Button>
            
            <Badge className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-1">
              מוכן לבדיקה
            </Badge>
          </div>
          
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-gray-900 mb-1 truncate">
              {submission.item_name_at_submission}
            </h1>
            <p className="text-sm text-gray-500 truncate">
              {submission.restaurant_name}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto flex-1">
        <div className="px-4 py-4 space-y-4 pb-6">
          {/* Image Display */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                <h3 className="font-semibold text-base">התמונה המשופרת שלכם</h3>
                
                {processedImage && (
                  <div className="relative rounded-xl overflow-hidden shadow-md bg-white">
                    <div className="aspect-square w-full">
                      <img 
                        src={processedImage}
                        alt="תמונה משופרת"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                        משופר ✨
                      </Badge>
                    </div>
                  </div>
                )}

                {originalImage && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">תמונה מקורית להשוואה:</p>
                    <div className="relative rounded-lg overflow-hidden bg-white">
                      <div className="aspect-video w-full">
                        <img 
                          src={originalImage}
                          alt="תמונה מקורית"
                          className="w-full h-full object-cover opacity-70"
                          loading="lazy"
                        />
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          מקור
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rating Section */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-base mb-4">מה דעתכם על התוצאה?</h3>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors p-1"
                    type="button"
                  >
                    <Star 
                      className={`w-7 h-7 ${
                        star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Quick Feedback Buttons */}
              <div className="flex flex-wrap gap-2 mb-4 justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 border-green-300 hover:bg-green-50 text-xs px-3 py-2"
                  onClick={() => {
                    setRating(5);
                    setFeedback('מושלם! התמונה נראית מדהימה!');
                  }}
                  type="button"
                >
                  <ThumbsUp className="w-3 h-3 ml-1" />
                  מושלם!
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-pink-600 border-pink-300 hover:bg-pink-50 text-xs px-3 py-2"
                  onClick={() => {
                    setRating(4);
                    setFeedback('אהבתי מאוד את התוצאה');
                  }}
                  type="button"
                >
                  <Heart className="w-3 h-3 ml-1" />
                  אהבתי
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-orange-600 border-orange-300 hover:bg-orange-50 text-xs px-3 py-2"
                  onClick={() => {
                    setRating(2);
                    setFeedback('צריך שיפורים');
                  }}
                  type="button"
                >
                  <ThumbsDown className="w-3 h-3 ml-1" />
                  צריך שיפורים
                </Button>
              </div>

              {/* Feedback Text */}
              <Textarea 
                placeholder="ספרו לנו מה אהבתם או מה היה נהדר לשפר..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="resize-none mb-4 text-sm"
              />

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitReview}
                disabled={rating === 0 || submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                type="button"
              >
                {submitting ? 'שולח...' : 'שלח משוב'}
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                if (processedImage) {
                  const link = document.createElement('a');
                  link.href = processedImage;
                  link.download = `${submission.item_name_at_submission}-processed.jpg`;
                  link.click();
                }
              }}
              type="button"
            >
              <Download className="w-4 h-4 ml-2" />
              הורד תמונה משופרת
            </Button>
            
            <Button variant="outline" className="w-full" type="button">
              <Share2 className="w-4 h-4 ml-2" />
              שתף עם חברים
            </Button>
            
            <Button variant="outline" className="w-full" type="button">
              <MessageCircle className="w-4 h-4 ml-2" />
              צור קשר עם הצוות
            </Button>
          </div>

          {/* Bottom Safe Area */}
          <div className="h-4 pb-safe"></div>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviewPage;
