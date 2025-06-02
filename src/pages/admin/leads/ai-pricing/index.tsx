import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { 
  useAIPricingSettings, 
  useUpdateAIPricingSetting
} from '@/hooks/useEnhancedLeads';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';

const AIPricingSettingsPage: React.FC = () => {
  const { data: settings, isLoading, error } = useAIPricingSettings();
  const updateSetting = useUpdateAIPricingSetting();
  
  const handleUpdateSetting = (settingId: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast.error('יש להזין ערך מספרי חוקי');
      return;
    }
    
    updateSetting.mutate({ settingId, value: numValue });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-xl font-bold text-red-600 mb-2">שגיאה בטעינת הגדרות מחירי AI</h2>
          <p>{(error as Error).message}</p>
          <Button asChild className="mt-4">
            <Link to="/admin/leads">
              <ArrowLeft className="mr-2 h-4 w-4" />
              חזרה לניהול לידים
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  // Get specific settings for display
  const trainingCostSetting = settings?.find(s => s.setting_name === 'default_training_cost_per_unit');
  const promptCostSetting = settings?.find(s => s.setting_name === 'default_prompt_cost_per_unit');
  const exchangeRateSetting = settings?.find(s => s.setting_name === 'usd_to_local_currency_rate');
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" asChild className="mr-4">
          <Link to="/admin/leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            חזרה לניהול לידים
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">הגדרות עלויות AI</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Training Cost Setting */}
        <Card>
          <CardHeader>
            <CardTitle>עלות ברירת מחדל לאימון AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                עלות ברירת המחדל שתוגדר ללידים חדשים עבור כל יחידת אימון AI
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={trainingCostSetting?.setting_value || 1.5}
                  id={`setting-${trainingCostSetting?.setting_id}`}
                />
                <Button 
                  onClick={() => {
                    const input = document.getElementById(`setting-${trainingCostSetting?.setting_id}`) as HTMLInputElement;
                    if (trainingCostSetting && input) {
                      handleUpdateSetting(trainingCostSetting.setting_id, input.value);
                    }
                  }}
                >
                  עדכן
                </Button>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">ערך נוכחי:</span>{' '}
                {formatCurrency(trainingCostSetting?.setting_value || 1.5)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Prompt Cost Setting */}
        <Card>
          <CardHeader>
            <CardTitle>עלות ברירת מחדל לפרומפט AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                עלות ברירת המחדל שתוגדר ללידים חדשים עבור כל יחידת פרומפט AI
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={promptCostSetting?.setting_value || 0.16}
                  id={`setting-${promptCostSetting?.setting_id}`}
                />
                <Button 
                  onClick={() => {
                    const input = document.getElementById(`setting-${promptCostSetting?.setting_id}`) as HTMLInputElement;
                    if (promptCostSetting && input) {
                      handleUpdateSetting(promptCostSetting.setting_id, input.value);
                    }
                  }}
                >
                  עדכן
                </Button>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">ערך נוכחי:</span>{' '}
                {formatCurrency(promptCostSetting?.setting_value || 0.16)}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Exchange Rate Setting */}
        <Card>
          <CardHeader>
            <CardTitle>שער המרה דולר לש"ח</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground">
                שער ההמרה המשמש לחישוב ROI (מספר ש"ח לדולר)
              </div>
              
              <div className="flex items-center space-x-2 space-x-reverse">
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={exchangeRateSetting?.setting_value || 3.65}
                  id={`setting-${exchangeRateSetting?.setting_id}`}
                />
                <Button 
                  onClick={() => {
                    const input = document.getElementById(`setting-${exchangeRateSetting?.setting_id}`) as HTMLInputElement;
                    if (exchangeRateSetting && input) {
                      handleUpdateSetting(exchangeRateSetting.setting_id, input.value);
                    }
                  }}
                >
                  עדכן
                </Button>
              </div>
              
              <div className="text-sm">
                <span className="font-medium">ערך נוכחי:</span>{' '}
                {exchangeRateSetting?.setting_value || 3.65} ש"ח לדולר
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8 bg-muted/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">מידע על חישובי עלויות AI</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-md font-medium">אימוני AI</h3>
            <p className="text-sm text-muted-foreground">
              אימון AI הוא תהליך עתיר משאבים שבו המערכת מאמנת מודלים חדשים על תמונות המסעדה. 
              כל אימון נספר כיחידה נפרדת עם עלות קבועה.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium">פרומפטים</h3>
            <p className="text-sm text-muted-foreground">
              פרומפטים הם בקשות לעיבוד תמונה בודדת באמצעות AI. 
              כל פרומפט נספר כיחידה נפרדת עם עלות קבועה.
            </p>
          </div>
          
          <div>
            <h3 className="text-md font-medium">חישוב ROI</h3>
            <p className="text-sm text-muted-foreground">
              ROI (החזר השקעה) מחושב לפי הנוסחה הבאה:
              <br />
              <code className="bg-muted p-1 rounded">
                ROI = ((הכנסה בדולר - עלות AI) / עלות AI) * 100%
              </code>
              <br />
              המערכת ממירה הכנסות בש"ח לדולר לפי שער ההמרה המוגדר לצורך חישוב ה-ROI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPricingSettingsPage; 