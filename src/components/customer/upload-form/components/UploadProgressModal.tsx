import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Upload, Database, Globe, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
  progress: number;
  details?: string;
  error?: string;
}

export interface UploadProgressData {
  currentStep: number;
  totalSteps: number;
  overallProgress: number;
  steps: UploadStep[];
  dishName?: string;
  currentDish: number;
  totalDishes: number;
  canCancel: boolean;
  isComplete: boolean;
}

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  progressData: UploadProgressData;
}

const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
  isOpen,
  onClose,
  onCancel,
  progressData
}) => {
  const getStepIcon = (step: UploadStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'in-progress':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />;
    }
  };

  const getStepIconByType = (stepId: string) => {
    switch (stepId) {
      case 'compress':
        return <Upload className="w-4 h-4" />;
      case 'upload':
        return <Upload className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'webhook':
        return <Globe className="w-4 h-4" />;
      default:
        return <Upload className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-lg mx-auto p-0 bg-white rounded-xl shadow-2xl border-0 [&>button]:hidden"
      >
        <div className="p-6" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B1E3F] to-[#7A1B37] rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">העלאת הגשות</h2>
                <p className="text-sm text-gray-600">
                  מנה {progressData.currentDish} מתוך {progressData.totalDishes}
                  {progressData.dishName && ` - ${progressData.dishName}`}
                </p>
                {progressData.totalSteps > 0 && (
                  <p className="text-xs text-gray-500">
                    שלב {progressData.currentStep + 1} מתוך {progressData.totalSteps}
                  </p>
                )}
              </div>
            </div>
            
            {progressData.canCancel && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">התקדמות כללית</span>
              <span className="text-sm font-bold text-[#8B1E3F]">
                {Math.round(progressData.overallProgress)}%
              </span>
            </div>
            <Progress 
              value={progressData.overallProgress} 
              className="h-3 bg-gray-100"
            />
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-6">
            {progressData.steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getStepIcon(step)}
                </div>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStepIconByType(step.id)}
                    <span className={cn(
                      "text-sm font-medium",
                      step.status === 'completed' ? "text-green-700" :
                      step.status === 'error' ? "text-red-700" :
                      step.status === 'in-progress' ? "text-blue-700" :
                      "text-gray-500"
                    )}>
                      {step.name}
                    </span>
                  </div>
                  
                  {step.status === 'in-progress' && (
                    <div className="mb-2">
                      <Progress 
                        value={step.progress} 
                        className="h-2 bg-gray-100"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {Math.round(step.progress)}%
                      </div>
                    </div>
                  )}
                  
                  {step.details && (
                    <p className="text-xs text-gray-600">{step.details}</p>
                  )}
                  
                  {step.error && (
                    <p className="text-xs text-red-600 mt-1">{step.error}</p>
                  )}
                </div>

                {step.status === 'completed' && (
                  <div className="text-xs text-green-600 font-medium">
                    הושלם
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Success State */}
          {progressData.isComplete && (
            <div className="text-center py-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-700 mb-2">
                ההעלאה הושלמה בהצלחה!
              </h3>
              <p className="text-sm text-gray-600">
                {progressData.totalDishes} הגשות נשמרו במערכת
              </p>
            </div>
          )}

          {/* Footer */}
          {!progressData.isComplete && (
            <div className="text-center text-xs text-gray-500">
              אנא אל תסגרו את החלון במהלך ההעלאה
            </div>
          )}

          {progressData.isComplete && onClose && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={onClose}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                סגור
              </Button>
            </div>
          )}

          {/* Cancel button for non-complete state */}
          {!progressData.isComplete && progressData.canCancel && onCancel && (
            <div className="flex justify-center mt-4">
              <Button
                onClick={onCancel}
                variant="outline"
                className="text-gray-600 hover:text-gray-800"
              >
                ביטול
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadProgressModal; 