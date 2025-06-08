import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Client } from '@/types/client';

interface ClientCostTrackingProps {
  client: Client;
  clientId: string;
}

export const ClientCostTracking: React.FC<ClientCostTrackingProps> = ({ client, clientId }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    ai_training_25_count: client.ai_training_25_count || 0,
    ai_training_15_count: client.ai_training_15_count || 0,
    ai_training_5_count: client.ai_training_5_count || 0,
    ai_prompts_count: client.ai_prompts_count || 0,
    ai_prompt_cost_per_unit: client.ai_prompt_cost_per_unit || 0.162,
    revenue_from_client_local: client.revenue_from_client_local || 0,
    exchange_rate_at_conversion: client.exchange_rate_at_conversion || 3.6,
  });

  const queryClient = useQueryClient();

  const handleFieldChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFieldBlur = async (field: string, value: number) => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('clients')
        .update({ [field]: value })
        .eq('client_id', clientId);

      if (error) {
        throw error;
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      
      toast.success(`${getFieldLabel(field)} עודכן בהצלחה`);
    } catch (error: any) {
      console.error('Error updating client cost field:', error);
      toast.error(`שגיאה בעדכון ${getFieldLabel(field)}: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      ai_training_25_count: 'אימוני AI (2.5$)',
      ai_training_15_count: 'אימוני AI (1.5$)',
      ai_training_5_count: 'אימוני AI (5$)',
      ai_prompts_count: 'פרומפטים',
      ai_prompt_cost_per_unit: 'עלות פרומפט ליחידה',
      revenue_from_client_local: 'הכנסות בשקלים',
      exchange_rate_at_conversion: 'שער חליפין USD/ILS',
    };
    return labels[field] || field;
  };

  // Calculate totals
  const calculateTotalCosts = () => {
    return (
      (formData.ai_training_25_count * 2.5) +
      (formData.ai_training_15_count * 1.5) +
      (formData.ai_training_5_count * 5) +
      (formData.ai_prompts_count * formData.ai_prompt_cost_per_unit)
    );
  };

  const calculateTotalCostsILS = () => {
    return calculateTotalCosts() * formData.exchange_rate_at_conversion;
  };

  const calculateROI = () => {
    const totalCosts = calculateTotalCosts();
    const revenueUSD = formData.revenue_from_client_local / formData.exchange_rate_at_conversion;
    
    if (totalCosts === 0) return 0;
    return ((revenueUSD - totalCosts) / totalCosts) * 100;
  };

  return (
    <div className="space-y-6">

      
      {/* Financial Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            מידע כלכלי
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">סך כל העלויות (₪)</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded border">
                <span className="text-lg font-semibold">
                  ₪{calculateTotalCostsILS().toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                סכום אימונים + פרומפטים בשקלים
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">עלויות AI כוללות (USD)</Label>
              <p className="text-sm text-gray-600 mt-1">
                ${calculateTotalCosts().toFixed(2)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">אימוני AI (2.5$)</Label>
              <Input
                type="number"
                min="0"
                value={formData.ai_training_25_count || ''}
                onBlur={(e) => handleFieldBlur('ai_training_25_count', parseInt(e.target.value) || 0)}
                onChange={(e) => handleFieldChange('ai_training_25_count', parseInt(e.target.value) || 0)}
                className="mt-1"
                placeholder="0"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">אימוני AI (1.5$)</Label>
              <Input
                type="number"
                min="0"
                value={formData.ai_training_15_count || ''}
                onBlur={(e) => handleFieldBlur('ai_training_15_count', parseInt(e.target.value) || 0)}
                onChange={(e) => handleFieldChange('ai_training_15_count', parseInt(e.target.value) || 0)}
                className="mt-1"
                placeholder="0"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">אימוני AI (5$)</Label>
              <Input
                type="number"
                min="0"
                value={formData.ai_training_5_count || ''}
                onBlur={(e) => handleFieldBlur('ai_training_5_count', parseInt(e.target.value) || 0)}
                onChange={(e) => handleFieldChange('ai_training_5_count', parseInt(e.target.value) || 0)}
                className="mt-1"
                placeholder="0"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">פרומפטים (0.162$)</Label>
              <Input
                type="number"
                min="0"
                value={formData.ai_prompts_count || ''}
                onBlur={(e) => handleFieldBlur('ai_prompts_count', parseInt(e.target.value) || 0)}
                onChange={(e) => handleFieldChange('ai_prompts_count', parseInt(e.target.value) || 0)}
                className="mt-1"
                placeholder="0"
                disabled={isUpdating}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <Label className="text-sm font-medium">עלות פרומפט ליחידה ($)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.ai_prompt_cost_per_unit || ''}
                onBlur={(e) => handleFieldBlur('ai_prompt_cost_per_unit', parseFloat(e.target.value) || 0.162)}
                onChange={(e) => handleFieldChange('ai_prompt_cost_per_unit', parseFloat(e.target.value) || 0.162)}
                className="mt-1"
                placeholder="0.162"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">הכנסות מהלקוח (₪)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.revenue_from_client_local || ''}
                onBlur={(e) => handleFieldBlur('revenue_from_client_local', parseFloat(e.target.value) || 0)}
                onChange={(e) => handleFieldChange('revenue_from_client_local', parseFloat(e.target.value) || 0)}
                className="mt-1"
                placeholder="0.00"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label className="text-sm font-medium">שער חליפין (USD/ILS)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.exchange_rate_at_conversion || ''}
                onBlur={(e) => handleFieldBlur('exchange_rate_at_conversion', parseFloat(e.target.value) || 3.6)}
                onChange={(e) => handleFieldChange('exchange_rate_at_conversion', parseFloat(e.target.value) || 3.6)}
                className="mt-1"
                placeholder="3.60"
                disabled={isUpdating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ROI and Revenue Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            תשואה והכנסות
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">הכנסות (USD)</Label>
              <div className="mt-1 p-2 bg-blue-50 rounded border">
                <span className="text-lg font-semibold text-blue-700">
                  ${(formData.revenue_from_client_local / formData.exchange_rate_at_conversion).toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">רווח נקי (USD)</Label>
              <div className="mt-1 p-2 bg-green-50 rounded border">
                <span className="text-lg font-semibold text-green-700">
                  ${((formData.revenue_from_client_local / formData.exchange_rate_at_conversion) - calculateTotalCosts()).toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">ROI</Label>
              <div className="mt-1 p-2 bg-purple-50 rounded border">
                <span className={`text-lg font-semibold ${calculateROI() >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {calculateROI().toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm text-gray-600">
              <strong>פירוט עלויות:</strong>
              <ul className="mt-1 space-y-1">
                <li>אימוני 2.5$: {formData.ai_training_25_count} × $2.5 = ${(formData.ai_training_25_count * 2.5).toFixed(2)}</li>
                <li>אימוני 1.5$: {formData.ai_training_15_count} × $1.5 = ${(formData.ai_training_15_count * 1.5).toFixed(2)}</li>
                <li>אימוני 5$: {formData.ai_training_5_count} × $5.0 = ${(formData.ai_training_5_count * 5).toFixed(2)}</li>
                <li>פרומפטים: {formData.ai_prompts_count} × ${formData.ai_prompt_cost_per_unit} = ${(formData.ai_prompts_count * formData.ai_prompt_cost_per_unit).toFixed(2)}</li>
              </ul>
            </div>
            <div className="text-sm text-gray-600">
              <strong>סיכום כללי:</strong>
              <ul className="mt-1 space-y-1">
                <li>סה"כ עלויות: ${calculateTotalCosts().toFixed(2)}</li>
                <li>סה"כ עלויות (₪): ₪{calculateTotalCostsILS().toFixed(2)}</li>
                <li>הכנסות (₪): ₪{formData.revenue_from_client_local.toFixed(2)}</li>
                <li>שער חליפין: {formData.exchange_rate_at_conversion}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 