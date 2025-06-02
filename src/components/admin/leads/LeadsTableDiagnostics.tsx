import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Database,
  Eye,
  EyeOff 
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';

interface FieldDiagnostic {
  fieldName: string;
  label: string;
  status: 'success' | 'warning' | 'error';
  issue?: string;
  suggestion?: string;
  sampleValue?: any;
  nullCount: number;
  validCount: number;
  totalCount: number;
}

export const LeadsTableDiagnostics: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSampleData, setShowSampleData] = useState(false);

  // Fetch raw leads data directly from database
  const { data: leadsData, isLoading, refetch } = useQuery({
    queryKey: ['leads-diagnostics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .limit(50); // Get first 50 leads for analysis

      if (error) throw error;
      return data as Lead[];
    },
  });

  const runDiagnostics = (leads: Lead[]): FieldDiagnostic[] => {
    if (!leads || leads.length === 0) return [];

    const fields = [
      { key: 'lead_id', label: 'Lead ID', required: true },
      { key: 'restaurant_name', label: 'שם מסעדה', required: true },
      { key: 'contact_name', label: 'איש קשר', required: true },
      { key: 'phone', label: 'טלפון', required: true },
      { key: 'email', label: 'אימייל', required: true },
      { key: 'website_url', label: 'אתר אינטרנט', required: false },
      { key: 'address', label: 'כתובת', required: false },
      { key: 'business_type', label: 'סוג עסק', required: false },
      { key: 'lead_status', label: 'סטטוס', required: true },
      { key: 'lead_source', label: 'מקור ליד', required: false },
      { key: 'ai_trainings_count', label: 'מספר אימונים', required: false },
      { key: 'ai_training_cost_per_unit', label: 'עלות אימון ליחידה', required: false },
      { key: 'ai_prompts_count', label: 'מספר פרומפטים', required: false },
      { key: 'ai_prompt_cost_per_unit', label: 'עלות פרומפט ליחידה', required: false },
      { key: 'total_ai_costs', label: 'סה״כ עלויות AI', required: false },
      { key: 'revenue_from_lead_local', label: 'הכנסות מקומיות', required: false },
      { key: 'exchange_rate_at_conversion', label: 'שער המרה', required: false },
      { key: 'revenue_from_lead_usd', label: 'הכנסות USD', required: false },
      { key: 'roi', label: 'ROI', required: false }, // ⭐ This is the problematic field
      { key: 'created_at', label: 'תאריך יצירה', required: true },
      { key: 'updated_at', label: 'תאריך עדכון', required: true },
      { key: 'next_follow_up_date', label: 'תאריך מעקב הבא', required: false },
      { key: 'notes', label: 'הערות', required: false },
      { key: 'client_id', label: 'מזהה לקוח', required: false },
      { key: 'free_sample_package_active', label: 'חבילת טעימה פעילה', required: false },
    ];

    const diagnostics: FieldDiagnostic[] = [];

    fields.forEach(field => {
      const validCount = leads.filter(lead => {
        const value = (lead as any)[field.key];
        return value !== null && value !== undefined && value !== '';
      }).length;

      const nullCount = leads.length - validCount;
      const sampleValue = leads.find(lead => {
        const value = (lead as any)[field.key];
        return value !== null && value !== undefined && value !== '';
      })?.[field.key as keyof Lead];

      let status: 'success' | 'warning' | 'error' = 'success';
      let issue: string | undefined;
      let suggestion: string | undefined;

      // Special checks for ROI field
      if (field.key === 'roi') {
        const roiValues = leads.map(lead => lead.roi).filter(roi => roi !== null && roi !== undefined);
        const hasValidRoi = roiValues.length > 0;
        const hasRevenueData = leads.some(lead => lead.revenue_from_lead_local && lead.revenue_from_lead_local > 0);
        const hasCostData = leads.some(lead => lead.total_ai_costs && lead.total_ai_costs > 0);

        if (!hasValidRoi) {
          status = 'error';
          issue = 'אין נתוני ROI כלל בדאטאבייס';
          suggestion = hasRevenueData && hasCostData 
            ? 'יש נתוני הכנסות ועלויות - ייתכן שיש בעיה בחישוב ROI במסד הנתונים'
            : 'חסרים נתוני הכנסות או עלויות בסיסיים לחישוב ROI';
        } else if (validCount < leads.length * 0.3) {
          status = 'warning';
          issue = `רק ${Math.round((validCount / leads.length) * 100)}% מהלידים יש ROI`;
          suggestion = 'רוב הלידים חסר להם נתוני הכנסות או עלויות';
        }
      }

      // Check for required fields
      if (field.required && validCount === 0) {
        status = 'error';
        issue = 'שדה חובה חסר בכל הרשומות';
        suggestion = 'יש לוודא שהשדה מוגדר נכון במסד הנתונים';
      } else if (field.required && validCount < leads.length * 0.9) {
        status = 'warning';
        issue = `שדה חובה חסר ב-${leads.length - validCount} רשומות`;
        suggestion = 'יש לוודא שכל הרשומות החדשות מכילות את השדה';
      }

      // Check for date fields
      if (field.key.includes('date') || field.key.includes('_at')) {
        const invalidDates = leads.filter(lead => {
          const value = (lead as any)[field.key];
          if (!value) return false;
          return isNaN(new Date(value).getTime());
        }).length;

        if (invalidDates > 0) {
          status = 'warning';
          issue = `${invalidDates} תאריכים לא תקינים`;
          suggestion = 'יש לבדוק פורמט התאריכים במסד הנתונים';
        }
      }

      diagnostics.push({
        fieldName: field.key,
        label: field.label,
        status,
        issue,
        suggestion,
        sampleValue,
        nullCount,
        validCount,
        totalCount: leads.length,
      });
    });

    return diagnostics;
  };

  const diagnostics = leadsData ? runDiagnostics(leadsData) : [];
  const errorCount = diagnostics.filter(d => d.status === 'error').length;
  const warningCount = diagnostics.filter(d => d.status === 'warning').length;
  const successCount = diagnostics.filter(d => d.status === 'success').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatSampleValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) return 'NULL';
    
    try {
      if (fieldName.includes('date') || fieldName.includes('_at')) {
        return formatDate(value);
      }
      if (fieldName.includes('cost') || fieldName.includes('revenue')) {
        return formatCurrency(Number(value));
      }
      if (fieldName === 'roi') {
        return formatPercentage(Number(value));
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    } catch (error) {
      return `ERROR: ${String(value)}`;
    }
  };

  const createTestLeadsWithROI = async () => {
    try {
      const testLeads = [
        {
          restaurant_name: 'מסעדת בדיקת ROI 1',
          contact_name: 'בדיקה 1',
          phone: '050-1234567',
          email: 'test1@example.com',
          lead_status: 'ליד חדש',
          ai_trainings_count: 5,
          ai_training_cost_per_unit: 2.5,
          ai_prompts_count: 10,
          ai_prompt_cost_per_unit: 0.1,
          revenue_from_lead_local: 5000, // ₪5,000
          exchange_rate_at_conversion: 3.5, // $1 = ₪3.5
        },
        {
          restaurant_name: 'מסעדת בדיקת ROI 2',
          contact_name: 'בדיקה 2',
          phone: '050-7654321',
          email: 'test2@example.com',
          lead_status: 'הפך ללקוח',
          ai_trainings_count: 3,
          ai_training_cost_per_unit: 2.5,
          ai_prompts_count: 15,
          ai_prompt_cost_per_unit: 0.1,
          revenue_from_lead_local: 10000, // ₪10,000
          exchange_rate_at_conversion: 3.5,
        },
      ];

      for (const lead of testLeads) {
        const { error } = await supabase.from('leads').insert(lead);
        if (error) throw error;
      }

      toast.success('נוצרו 2 לידים לדוגמה עם נתוני ROI בהצלחה!');
      refetch(); // Refresh the diagnostics
    } catch (error) {
      console.error('Error creating test leads:', error);
      toast.error('שגיאה ביצירת לידים לדוגמה: ' + (error as Error).message);
    }
  };

  const checkROICalculation = async () => {
    try {
      // Run a test query to check the ROI calculation directly
      const { data, error } = await supabase
        .from('leads')
        .select(`
          restaurant_name,
          ai_trainings_count,
          ai_training_cost_per_unit,
          ai_prompts_count,
          ai_prompt_cost_per_unit,
          total_ai_costs,
          revenue_from_lead_local,
          exchange_rate_at_conversion,
          revenue_from_lead_usd,
          roi
        `)
        .not('revenue_from_lead_local', 'is', null)
        .not('total_ai_costs', 'is', null)
        .limit(5);

      if (error) throw error;

      console.log('ROI Calculation Check:', data);
      
      if (data && data.length > 0) {
        toast.success(`נמצאו ${data.length} לידים עם נתוני הכנסות ועלויות. בדוק את הקונסול לפרטים.`);
      } else {
        toast.warning('לא נמצאו לידים עם נתוני הכנסות ועלויות');
      }
    } catch (error) {
      console.error('Error checking ROI calculation:', error);
      toast.error('שגיאה בבדיקת חישוב ROI: ' + (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            בודק אבחון שדות הטבלה...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            אבחון שדות טבלת לידים
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-1" />
              רענן
            </Button>
            <Button 
              onClick={() => setShowSampleData(!showSampleData)} 
              variant="outline" 
              size="sm"
            >
              {showSampleData ? <EyeOff className="h-4 w-4 ml-1" /> : <Eye className="h-4 w-4 ml-1" />}
              {showSampleData ? 'הסתר דוגמאות' : 'הצג דוגמאות'}
            </Button>
          </div>
        </div>
        
        {/* Summary badges */}
        <div className="flex gap-2 mt-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {errorCount} שגיאות
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3" />
            {warningCount} אזהרות
          </Badge>
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            {successCount} תקין
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              {isExpanded ? 'הסתר פירוט מלא' : 'הצג פירוט מלא'}
              <RefreshCw className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>סטטוס</TableHead>
                    <TableHead>שדה</TableHead>
                    <TableHead>תקין/סה״כ</TableHead>
                    <TableHead>%</TableHead>
                    {showSampleData && <TableHead>דוגמה</TableHead>}
                    <TableHead>בעיה</TableHead>
                    <TableHead>הצעה לפתרון</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diagnostics.map((diagnostic) => (
                    <TableRow key={diagnostic.fieldName}>
                      <TableCell>{getStatusIcon(diagnostic.status)}</TableCell>
                      <TableCell className="font-medium">
                        {diagnostic.label}
                        <div className="text-xs text-muted-foreground">{diagnostic.fieldName}</div>
                      </TableCell>
                      <TableCell>
                        {diagnostic.validCount}/{diagnostic.totalCount}
                      </TableCell>
                      <TableCell>
                        {Math.round((diagnostic.validCount / diagnostic.totalCount) * 100)}%
                      </TableCell>
                      {showSampleData && (
                        <TableCell className="max-w-32 truncate">
                          {formatSampleValue(diagnostic.sampleValue, diagnostic.fieldName)}
                        </TableCell>
                      )}
                      <TableCell className="text-red-600">
                        {diagnostic.issue || '—'}
                      </TableCell>
                      <TableCell className="text-blue-600">
                        {diagnostic.suggestion || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Quick fixes for ROI issue */}
        {diagnostics.find(d => d.fieldName === 'roi' && d.status === 'error') && (
          <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-semibold text-red-800 mb-2">🚨 בעיית ROI זוהתה</h4>
            <p className="text-sm text-red-700 mb-3">
              לא נמצאו נתוני ROI בטבלה. זה עלול להיות בגלל:
            </p>
            <ul className="text-sm text-red-700 space-y-1 mb-3">
              <li>• הטיגר לחישוב ROI לא פועל במסד הנתונים</li>
              <li>• חסרים נתוני הכנסות ברוב הלידים</li>
              <li>• חסרים נתוני עלויות AI ברוב הלידים</li>
              <li>• שגיאה בנוסחת החישוב של ROI</li>
            </ul>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-red-700 border-red-300"
                onClick={createTestLeadsWithROI}
              >
                יצור לידים לדוגמה עם ROI
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-blue-700 border-blue-300"
                onClick={checkROICalculation}
              >
                בדוק חישוב ROI במסד הנתונים
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 